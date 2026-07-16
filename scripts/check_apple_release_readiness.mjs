import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");

const skippedDirs = new Set([
  ".git",
  ".build",
  "DerivedData",
  "dist",
  "node_modules",
]);

async function findNames(relativeDir, names) {
  const found = [];
  async function walk(dir) {
    let entries = [];
    try {
      entries = await readdir(new URL(dir, root), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relative = path.posix.join(dir, entry.name);
      if (names.some((name) => entry.name === name || entry.name.endsWith(name))) {
        found.push(relative);
      }
      if (entry.isDirectory() && !skippedDirs.has(entry.name)) {
        await walk(relative);
      }
    }
  }
  await walk(relativeDir);
  return found.sort();
}

function requireIncludes(source, needle, message) {
  assert.ok(source.includes(needle), message ?? `missing ${needle}`);
}

function requireExcludes(source, needle, message) {
  assert.ok(!source.includes(needle), message ?? `unexpected ${needle}`);
}

const [
  project,
  packageJson,
  gitignore,
  appleDoc,
  appSource,
  appAssets,
  accentAsset,
  runScript,
  xcodeScript,
  releaseIntake,
  finalAssetAcceptance,
] = await Promise.all([
  read("AMGDecoder.xcodeproj/project.pbxproj"),
  read("package.json"),
  read(".gitignore"),
  read("docs/apple-platform-readiness.md"),
  read("Sources/AMGDecoderApp/AMGDecoderApp.swift"),
  read("AppAssets/Assets.xcassets/Contents.json"),
  read("AppAssets/Assets.xcassets/AccentColor.colorset/Contents.json"),
  read("script/build_and_run.sh"),
  read("script/check_xcode_readiness.sh"),
  read("data/apple-release-metadata-intake.json").then(JSON.parse),
  read("data/apple-final-asset-acceptance.json").then(JSON.parse),
]);

const report = [];

for (const scriptHook of [
  '"test:release:readiness": "node scripts/check_apple_release_readiness.mjs"',
  '"test:release:assets": "node scripts/test_final_asset_acceptance_contract.mjs"',
  "check_apple_release_readiness.mjs",
  "test_final_asset_acceptance_contract.mjs",
]) {
  requireIncludes(packageJson, scriptHook, `package.json missing release readiness hook: ${scriptHook}`);
}
report.push("npm release-readiness command is wired");

for (const ignored of [
  "dist/",
  "DerivedData/",
  ".build/",
  "*.xcarchive/",
  "*.ipa",
  "*.dSYM/",
  "ExportOptions.plist",
  "*.mobileprovision",
  "*.provisionprofile",
]) {
  requireIncludes(gitignore, ignored, `.gitignore should exclude generated release artifact path ${ignored}`);
}
report.push("generated archive/export artifacts are ignored");

const localBundleIDs = [
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.ios;",
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.macos;",
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.uitests;",
];

for (const bundleID of localBundleIDs) {
  requireIncludes(project, bundleID, `Xcode project should retain local-only bundle id: ${bundleID}`);
}
report.push("Xcode bundle identifiers remain local-only");

for (const forbidden of [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "ASSETCATALOG_COMPILER_APPICON_NAME",
  "PrivacyInfo.xcprivacy",
  "ExportOptions.plist",
  "com.fugamante",
  "com.johnny",
]) {
  requireExcludes(project, forbidden, `Xcode project contains premature release metadata: ${forbidden}`);
  requireExcludes(runScript, forbidden, `local run script contains premature release metadata: ${forbidden}`);
  requireExcludes(xcodeScript, forbidden, `Xcode readiness script contains premature release metadata: ${forbidden}`);
}
report.push("signing, icon, privacy, export, and personal-identity claims are absent from project scripts");

for (const privacyHook of [
  "URLSession",
  "CLLocation",
  "CNContact",
  "PHPhotoLibrary",
  "AVCapture",
  "NSUserTrackingUsageDescription",
  "NSLocationWhenInUseUsageDescription",
  "NSCameraUsageDescription",
  "NSPhotoLibraryUsageDescription",
  "NSContactsUsageDescription",
]) {
  requireExcludes(appSource, privacyHook, `native app source contains unreviewed privacy/permission hook: ${privacyHook}`);
  requireExcludes(project, privacyHook, `Xcode project contains unreviewed privacy/permission hook: ${privacyHook}`);
}
report.push("native source does not declare reviewed privacy-sensitive APIs or permission strings");

requireIncludes(appAssets, '"author": "xcode"', "asset catalog root should remain valid");
requireIncludes(accentAsset, '"color-space": "srgb"', "AccentColor should remain a valid placeholder visual asset");
report.push("asset catalog remains accent-only without final app icon claims");

requireIncludes(packageJson, '"test:release:intake": "node scripts/test_release_metadata_intake_contract.mjs"', "package.json missing release metadata intake command");
requireIncludes(packageJson, '"dry-run:release:metadata": "node scripts/dry_run_release_metadata_application.mjs"', "package.json missing release metadata dry-run command");
requireIncludes(packageJson, '"test:release:dry-run": "node scripts/test_release_metadata_dry_run_contract.mjs && npm run dry-run:release:metadata"', "package.json missing release metadata dry-run test command");
requireIncludes(packageJson, "test_release_metadata_intake_contract.mjs", "npm test should include release metadata intake contract");
requireIncludes(packageJson, "test_release_metadata_dry_run_contract.mjs", "npm test should include release metadata dry-run contract");
assert.equal(releaseIntake.schemaVersion, 1, "release metadata intake schema version should stay explicit");
assert.equal(releaseIntake.status, "metadata_required", "release metadata intake should remain blocked");
assert.equal(releaseIntake.blockedUntilAllFieldsReviewed, true, "release metadata intake should block release until reviewed");
assert.equal(releaseIntake.policy.localOnlyUntilComplete, true, "release metadata intake should preserve local-only boundary");
assert.equal(releaseIntake.policy.doNotCreateReleaseArtifacts, true, "release metadata intake should block release artifacts");
assert.equal(releaseIntake.policy.descriptiveOnlyBoundary, true, "release metadata intake should preserve descriptive-only boundary");

const pendingFields = releaseIntake.sections.flatMap((section) => section.fields);
assert.ok(pendingFields.length >= 20, "release metadata intake should enumerate required metadata fields");
for (const field of pendingFields) {
  assert.equal(field.status, "pending_product_decision", `release metadata field ${field.id} should remain pending`);
  assert.equal(field.value, null, `release metadata field ${field.id} should not contain unsupplied metadata`);
}
report.push("release metadata intake exists and remains fully pending");

assert.equal(finalAssetAcceptance.schemaVersion, 1, "final asset acceptance schema version should stay explicit");
assert.equal(finalAssetAcceptance.status, "asset_metadata_required", "final asset acceptance should remain blocked");
assert.equal(finalAssetAcceptance.blockedUntilAllItemsApproved, true, "final asset acceptance should block final asset work");
assert.equal(finalAssetAcceptance.policy.doNotAddFinalArtwork, true, "final asset acceptance should not add final artwork");
assert.equal(finalAssetAcceptance.policy.doNotCreateReleaseArtifacts, true, "final asset acceptance should block release artifacts");
assert.equal(finalAssetAcceptance.policy.descriptiveOnlyBoundary, true, "final asset acceptance should preserve descriptive-only boundary");
assert.equal(finalAssetAcceptance.policy.captureScreenshotsFromRealAppUI, true, "final asset acceptance should require real app UI screenshots");

const finalAssetGroups = new Map(finalAssetAcceptance.assetGroups.map((group) => [group.id, group]));
for (const requiredGroup of [
  "app_icon_source_artwork",
  "app_icon_asset_catalog",
  "launch_asset_decision",
  "app_store_screenshot_policy",
]) {
  assert.ok(finalAssetGroups.has(requiredGroup), `final asset acceptance missing ${requiredGroup}`);
}

for (const group of finalAssetAcceptance.assetGroups) {
  assert.match(
    group.status,
    /^(pending_product_decision|blocked_pending_source_artwork)$/,
    `final asset group ${group.id} should not be approved yet`,
  );
  assert.ok(group.acceptance.length >= 3, `final asset group ${group.id} should list acceptance criteria`);
  assert.ok(group.forbiddenUntilApproved.length >= 1, `final asset group ${group.id} should list blocked outputs`);
}
report.push("final asset acceptance exists and remains blocked pending approved artwork and screenshot policy");

for (const docHook of [
  "Release Artifact Readiness",
  "Release Metadata Intake",
  "Final Asset Acceptance",
  "Do not create `.xcarchive`, `.ipa`, `ExportOptions.plist`, provisioning profiles, distribution certificates, notarization credentials, final app icons, App Store screenshots, or `PrivacyInfo.xcprivacy` as part of ordinary implementation passes.",
  "npm run test:release:readiness",
  "npm run test:release:intake",
  "npm run test:release:assets",
  "npm run dry-run:release:metadata",
  "privacy manifest",
  "archive export options",
  "data/apple-final-asset-acceptance.json",
]) {
  requireIncludes(appleDoc, docHook, `Apple readiness doc missing release artifact hook: ${docHook}`);
}
report.push("release artifact and privacy blockers are documented");

const forbiddenArtifacts = await findNames(".", [
  ".xcarchive",
  ".ipa",
  ".appiconset",
  ".icon",
  "PrivacyInfo.xcprivacy",
  "ExportOptions.plist",
  ".entitlements",
  ".mobileprovision",
  ".provisionprofile",
  ".cer",
  ".p12",
]);

assert.deepEqual(
  forbiddenArtifacts,
  [],
  `premature release artifacts present: ${forbiddenArtifacts.join(", ")}`,
);
report.push("no premature release artifacts are committed outside ignored build directories");

console.log("check_apple_release_readiness: ok");
for (const item of report) {
  console.log(`- ${item}`);
}

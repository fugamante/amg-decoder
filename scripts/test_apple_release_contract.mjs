import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../", import.meta.url);
const read = (relativePath) => readFile(new URL(relativePath, root), "utf8");

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
      if (entry.isDirectory() && !["node_modules", ".git", ".build", "dist", "DerivedData"].includes(entry.name)) {
        await walk(relative);
      }
    }
  }
  await walk(relativeDir);
  return found;
}

const [
  project,
  packageJson,
  gitignore,
  appleDoc,
  appSource,
  appAssets,
  accentAsset,
  releaseScript,
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
  read("scripts/check_apple_release_readiness.mjs"),
  read("data/apple-release-metadata-intake.json"),
  read("data/apple-final-asset-acceptance.json"),
]);

const requiredDocHooks = [
  "## Release Contract",
  "Privacy and permission surface",
  "No `PrivacyInfo.xcprivacy` file is committed yet",
  "Privacy Policy URL",
  "Required-reason API",
  "App icon and launch assets",
  "Generated artifact hygiene",
  "Release Artifact Readiness",
  "Release Metadata Intake",
  "Final Asset Acceptance",
  "npm run test:release:readiness",
  "npm run test:release:intake",
  "npm run test:release:assets",
  "data/apple-final-asset-acceptance.json",
  "Do not add a production bundle identifier, signing team, provisioning profile, App Store record, archive export options, final icon set, or privacy manifest without an explicit release metadata pass.",
];

for (const hook of requiredDocHooks) {
  assert.ok(appleDoc.includes(hook), `docs/apple-platform-readiness.md missing release contract hook: ${hook}`);
}

const requiredAppleAuthorities = [
  "Preparing your app for distribution",
  "App privacy details",
  "Manage app privacy",
  "App privacy",
  "Describing use of required reason API",
  "Configuring your app icon using an asset catalog",
  "Screenshot specifications",
];

for (const hook of requiredAppleAuthorities) {
  assert.ok(appleDoc.includes(hook), `Apple readiness doc missing authority reference: ${hook}`);
}

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
  assert.ok(gitignore.includes(ignored), `.gitignore should exclude generated Apple artifact path ${ignored}`);
}

assert.ok(packageJson.includes("test_apple_release_contract.mjs"), "npm test should include Apple release contract");
assert.ok(packageJson.includes("test_release_metadata_intake_contract.mjs"), "npm test should include release metadata intake contract");
assert.ok(packageJson.includes("test_release_metadata_dry_run_contract.mjs"), "npm test should include release metadata dry-run contract");
assert.ok(packageJson.includes("test_final_asset_acceptance_contract.mjs"), "npm test should include final asset acceptance contract");
assert.ok(packageJson.includes('"test:release:intake": "node scripts/test_release_metadata_intake_contract.mjs"'), "package.json should expose release metadata intake check");
assert.ok(packageJson.includes('"dry-run:release:metadata": "node scripts/dry_run_release_metadata_application.mjs"'), "package.json should expose release metadata dry-run");
assert.ok(packageJson.includes('"test:release:dry-run": "node scripts/test_release_metadata_dry_run_contract.mjs && npm run dry-run:release:metadata"'), "package.json should expose release metadata dry-run test");
assert.ok(packageJson.includes('"test:release:assets": "node scripts/test_final_asset_acceptance_contract.mjs"'), "package.json should expose final asset acceptance check");
assert.ok(packageJson.includes('"test:release:readiness": "node scripts/check_apple_release_readiness.mjs"'), "package.json should expose release readiness audit");
assert.ok(appAssets.includes('"author": "xcode"'), "asset catalog root should remain a valid Xcode asset catalog");
assert.ok(accentAsset.includes('"color-space": "srgb"'), "AccentColor should remain the only placeholder visual asset");
assert.ok(releaseScript.includes("check_apple_release_readiness: ok"), "release readiness script should print a stable success marker");
assert.ok(releaseScript.includes("*.xcarchive/"), "release readiness script should guard archive ignore hygiene");
assert.ok(releaseScript.includes("PrivacyInfo.xcprivacy"), "release readiness script should guard privacy manifest boundary");
assert.ok(releaseScript.includes("DEVELOPMENT_TEAM"), "release readiness script should guard signing-team boundary");
assert.ok(releaseScript.includes("apple-release-metadata-intake.json"), "release readiness script should validate release metadata intake");
assert.ok(releaseScript.includes("apple-final-asset-acceptance.json"), "release readiness script should validate final asset acceptance");
assert.ok(releaseIntake.includes('"status": "metadata_required"'), "release metadata intake should remain blocked");
assert.ok(releaseIntake.includes('"blockedUntilAllFieldsReviewed": true'), "release metadata intake should require field review");
assert.ok(finalAssetAcceptance.includes('"status": "asset_metadata_required"'), "final asset acceptance should remain blocked");
assert.ok(finalAssetAcceptance.includes('"blockedUntilAllItemsApproved": true'), "final asset acceptance should require product approval");
assert.ok(finalAssetAcceptance.includes('"captureScreenshotsFromRealAppUI": true'), "final asset acceptance should require real app UI screenshots");

const forbiddenProjectClaims = [
  "ASSETCATALOG_COMPILER_APPICON_NAME",
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "com.fugamante",
  "com.johnny",
  "PrivacyInfo.xcprivacy",
  "ExportOptions.plist",
];

for (const claim of forbiddenProjectClaims) {
  assert.ok(!project.includes(claim), `Xcode project contains premature release claim: ${claim}`);
}

const localBundleIDs = [
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.ios;",
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.macos;",
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.uitests;",
];

for (const bundleID of localBundleIDs) {
  assert.ok(project.includes(bundleID), `Xcode project should retain local-only bundle id: ${bundleID}`);
}

const forbiddenNativeHooks = [
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
];

for (const hook of forbiddenNativeHooks) {
  assert.ok(!appSource.includes(hook), `native app source contains unreviewed privacy/permission hook: ${hook}`);
  assert.ok(!project.includes(hook), `Xcode project contains unreviewed privacy/permission hook: ${hook}`);
}

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

assert.deepEqual(forbiddenArtifacts, [], `premature release artifacts present: ${forbiddenArtifacts.join(", ")}`);

console.log("test_apple_release_contract: ok");

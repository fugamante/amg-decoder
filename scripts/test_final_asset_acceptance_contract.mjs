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
  return found.sort();
}

const [assetContract, releaseIntake, packageJson, appleDoc, readme, project, appAssets, accentAsset] =
  await Promise.all([
    read("data/apple-final-asset-acceptance.json").then(JSON.parse),
    read("data/apple-release-metadata-intake.json").then(JSON.parse),
    read("package.json"),
    read("docs/apple-platform-readiness.md"),
    read("README.md"),
    read("AMGDecoder.xcodeproj/project.pbxproj"),
    read("AppAssets/Assets.xcassets/Contents.json"),
    read("AppAssets/Assets.xcassets/AccentColor.colorset/Contents.json"),
  ]);

assert.equal(assetContract.schemaVersion, 1, "final asset acceptance schema version should stay explicit");
assert.equal(assetContract.product, "AMG Decoder", "final asset acceptance should target AMG Decoder");
assert.equal(assetContract.slug, "amg-decoder", "final asset acceptance should target amg-decoder");
assert.equal(assetContract.status, "asset_metadata_required", "final asset acceptance should remain blocked");
assert.equal(assetContract.blockedUntilAllItemsApproved, true, "asset acceptance should block final asset work");
assert.equal(assetContract.policy.doNotAddFinalArtwork, true, "asset acceptance should not add final artwork");
assert.equal(assetContract.policy.doNotCreateReleaseArtifacts, true, "asset acceptance should not create release artifacts");
assert.equal(assetContract.policy.descriptiveOnlyBoundary, true, "asset acceptance should preserve descriptive-only boundary");
assert.equal(assetContract.policy.captureScreenshotsFromRealAppUI, true, "screenshots should be captured from real app UI");

const groups = new Map(assetContract.assetGroups.map((group) => [group.id, group]));
for (const requiredGroup of [
  "app_icon_source_artwork",
  "app_icon_asset_catalog",
  "launch_asset_decision",
  "app_store_screenshot_policy",
]) {
  assert.ok(groups.has(requiredGroup), `final asset acceptance missing ${requiredGroup}`);
}

for (const group of assetContract.assetGroups) {
  assert.match(
    group.status,
    /^(pending_product_decision|blocked_pending_source_artwork)$/,
    `asset group ${group.id} should not be approved yet`,
  );
  assert.ok(group.acceptance.length >= 3, `asset group ${group.id} should have acceptance criteria`);
  assert.ok(group.forbiddenUntilApproved.length >= 1, `asset group ${group.id} should list blocked outputs`);
}

const assetIntake = releaseIntake.sections.find((section) => section.id === "assets");
assert.ok(assetIntake, "release metadata intake should keep an assets section");
for (const fieldId of [
  "app_icon_source_artwork",
  "app_icon_review_owner",
  "launch_asset_decision",
  "app_store_screenshot_policy",
]) {
  const field = assetIntake.fields.find((candidate) => candidate.id === fieldId);
  assert.ok(field, `release metadata intake missing asset field ${fieldId}`);
  assert.equal(field.status, "pending_product_decision", `asset intake field ${fieldId} should remain pending`);
  assert.equal(field.value, null, `asset intake field ${fieldId} should not contain unsupplied metadata`);
}

for (const hook of [
  '"test:release:assets": "node scripts/test_final_asset_acceptance_contract.mjs"',
  "test_final_asset_acceptance_contract.mjs",
]) {
  assert.ok(packageJson.includes(hook), `package.json missing final asset acceptance hook: ${hook}`);
}

for (const hook of [
  "Final Asset Acceptance",
  "data/apple-final-asset-acceptance.json",
  "npm run test:release:assets",
  "AppIcon.appiconset",
  "App Store screenshot policy",
  "Screenshot specifications",
]) {
  assert.ok(appleDoc.includes(hook), `Apple readiness doc missing final asset hook: ${hook}`);
  assert.ok(readme.includes(hook), `README missing final asset hook: ${hook}`);
}

assert.ok(appAssets.includes('"author": "xcode"'), "asset catalog root should remain valid");
assert.ok(accentAsset.includes('"color-space": "srgb"'), "AccentColor should remain present");
assert.ok(!project.includes("ASSETCATALOG_COMPILER_APPICON_NAME"), "Xcode project must not claim a final app icon");

const forbiddenArtifacts = await findNames(".", [
  ".appiconset",
  ".icon",
  "App Store screenshots",
  "PrivacyInfo.xcprivacy",
  "ExportOptions.plist",
]);

assert.deepEqual(forbiddenArtifacts, [], `premature final asset or release artifacts present: ${forbiddenArtifacts.join(", ")}`);

console.log("test_final_asset_acceptance_contract: ok");

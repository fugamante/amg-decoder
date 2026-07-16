import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const intake = JSON.parse(
  await readFile(new URL("../data/apple-release-metadata-intake.json", import.meta.url), "utf8"),
);
const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
const appleDoc = await readFile(new URL("../docs/apple-platform-readiness.md", import.meta.url), "utf8");
const releaseScript = await readFile(new URL("../scripts/check_apple_release_readiness.mjs", import.meta.url), "utf8");

assert.equal(intake.schemaVersion, 1, "release metadata intake schema version should stay explicit");
assert.equal(intake.product, "AMG Decoder", "release metadata intake should use canonical product name");
assert.equal(intake.slug, "amg-decoder", "release metadata intake should use intended public slug");
assert.equal(intake.status, "metadata_required", "release metadata intake should remain blocked");
assert.equal(intake.blockedUntilAllFieldsReviewed, true, "release metadata intake should block release until reviewed");
assert.equal(intake.policy.localOnlyUntilComplete, true, "release metadata intake should preserve local-only boundary");
assert.equal(intake.policy.doNotCreateReleaseArtifacts, true, "release metadata intake should block release artifacts");
assert.equal(intake.policy.descriptiveOnlyBoundary, true, "release metadata intake should preserve descriptive-only boundary");

const requiredSections = new Map([
  ["identity", ["approved_display_name", "production_bundle_id_ios", "production_bundle_id_macos", "app_store_sku", "copyright_holder"]],
  ["signing", ["apple_developer_team_id", "provisioning_strategy", "distribution_certificate_policy", "entitlements_and_capabilities"]],
  ["privacy", ["privacy_policy_url", "app_store_privacy_answers", "required_reason_api_review", "privacy_manifest_decision", "third_party_sdk_privacy_review"]],
  ["assets", ["app_icon_source_artwork", "app_icon_review_owner", "launch_asset_decision", "app_store_screenshot_policy"]],
  ["store_listing", ["subtitle", "description", "keywords", "support_url", "age_rating", "content_rights"]],
  ["archive_export", ["distribution_channel", "archive_scheme_policy", "export_method", "export_options_owner", "mac_notarization_decision"]],
]);

const sectionsById = new Map(intake.sections.map((section) => [section.id, section]));

for (const [sectionId, requiredFields] of requiredSections) {
  const section = sectionsById.get(sectionId);
  assert.ok(section, `release metadata intake missing section ${sectionId}`);
  assert.ok(section.requiredBefore, `release metadata intake section ${sectionId} should declare requiredBefore`);
  const fieldsById = new Map(section.fields.map((field) => [field.id, field]));
  for (const fieldId of requiredFields) {
    const field = fieldsById.get(fieldId);
    assert.ok(field, `release metadata intake section ${sectionId} missing field ${fieldId}`);
    assert.equal(field.status, "pending_product_decision", `release metadata field ${fieldId} should remain pending`);
    assert.equal(field.value, null, `release metadata field ${fieldId} should not contain unsupplied metadata`);
  }
}

for (const releaseValue of [
  "com.amg",
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "app-store",
  "developer-id",
]) {
  assert.ok(!JSON.stringify(intake).includes(releaseValue), `release metadata intake contains premature value: ${releaseValue}`);
}

for (const hook of [
  '"test:release:intake": "node scripts/test_release_metadata_intake_contract.mjs"',
  "test_release_metadata_intake_contract.mjs",
]) {
  assert.ok(packageJson.includes(hook), `package.json missing release metadata intake hook: ${hook}`);
}

for (const hook of [
  "Release Metadata Intake",
  "data/apple-release-metadata-intake.json",
  "npm run test:release:intake",
  "production_bundle_id_ios",
  "privacy_manifest_decision",
  "app_icon_source_artwork",
  "mac_notarization_decision",
]) {
  assert.ok(appleDoc.includes(hook), `Apple readiness doc missing release metadata intake hook: ${hook}`);
}

assert.ok(releaseScript.includes("apple-release-metadata-intake.json"), "release readiness script should validate metadata intake");

console.log("test_release_metadata_intake_contract: ok");

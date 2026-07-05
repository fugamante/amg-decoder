import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const intake = JSON.parse(
  await readFile(new URL("../data/apple-release-metadata-intake.json", import.meta.url), "utf8"),
);

const applicationPlan = [
  {
    id: "bundle_ids",
    title: "Bundle identifiers",
    section: "identity",
    requiredFields: ["production_bundle_id_ios", "production_bundle_id_macos"],
    targets: ["AMGDecoder.xcodeproj/project.pbxproj"],
    dryRunChanges: [
      "Replace PRODUCT_BUNDLE_IDENTIFIER app.amgdecoder.local.ios only after production_bundle_id_ios is approved",
      "Replace PRODUCT_BUNDLE_IDENTIFIER app.amgdecoder.local.macos only after production_bundle_id_macos is approved"
    ]
  },
  {
    id: "signing",
    title: "Signing and provisioning",
    section: "signing",
    requiredFields: [
      "apple_developer_team_id",
      "provisioning_strategy",
      "distribution_certificate_policy",
      "entitlements_and_capabilities"
    ],
    targets: ["AMGDecoder.xcodeproj/project.pbxproj"],
    dryRunChanges: [
      "Add signing team and provisioning settings only after the signing section is approved",
      "Add entitlements only after capabilities are approved"
    ]
  },
  {
    id: "privacy",
    title: "Privacy manifest and App Store privacy",
    section: "privacy",
    requiredFields: [
      "privacy_policy_url",
      "app_store_privacy_answers",
      "required_reason_api_review",
      "privacy_manifest_decision",
      "third_party_sdk_privacy_review"
    ],
    targets: ["App Store Connect", "PrivacyInfo.xcprivacy"],
    dryRunChanges: [
      "Create PrivacyInfo.xcprivacy only after privacy_manifest_decision is approved",
      "Prepare App Store privacy answers only after privacy review fields are approved"
    ]
  },
  {
    id: "assets",
    title: "Final assets",
    section: "assets",
    requiredFields: [
      "app_icon_source_artwork",
      "app_icon_review_owner",
      "launch_asset_decision",
      "app_store_screenshot_policy"
    ],
    targets: ["AppAssets/Assets.xcassets", "App Store screenshots"],
    dryRunChanges: [
      "Add AppIcon.appiconset only after approved source artwork is supplied",
      "Generate App Store screenshots only after screenshot policy is approved"
    ]
  },
  {
    id: "store_listing",
    title: "App Store listing",
    section: "store_listing",
    requiredFields: ["subtitle", "description", "keywords", "support_url", "age_rating", "content_rights"],
    targets: ["App Store Connect"],
    dryRunChanges: [
      "Prepare App Store listing metadata only after all store_listing fields are approved"
    ]
  },
  {
    id: "archive_export",
    title: "Archive and export workflow",
    section: "archive_export",
    requiredFields: [
      "distribution_channel",
      "archive_scheme_policy",
      "export_method",
      "export_options_owner",
      "mac_notarization_decision"
    ],
    targets: ["archive script", "ExportOptions.plist", "notarization workflow"],
    dryRunChanges: [
      "Add archive/export commands only after archive/export fields are approved",
      "Add notarization workflow only after mac_notarization_decision is approved"
    ]
  }
];

function sectionsById() {
  return new Map(intake.sections.map((section) => [section.id, section]));
}

function fieldMapFor(sectionId) {
  const section = sectionsById().get(sectionId);
  assert.ok(section, `metadata intake missing section ${sectionId}`);
  return new Map(section.fields.map((field) => [field.id, field]));
}

function fieldState(sectionId, fieldId) {
  const field = fieldMapFor(sectionId).get(fieldId);
  assert.ok(field, `metadata intake section ${sectionId} missing field ${fieldId}`);
  return field;
}

function isApproved(field) {
  return field.status === "approved" && field.value !== null && field.value !== "";
}

assert.equal(intake.product, "AMG Decoder", "release metadata dry-run should target AMG Decoder");
assert.equal(intake.slug, "amg-decoder", "release metadata dry-run should target amg-decoder");
assert.equal(intake.policy.localOnlyUntilComplete, true, "release metadata dry-run should preserve local-only boundary");
assert.equal(intake.policy.doNotCreateReleaseArtifacts, true, "release metadata dry-run must not create release artifacts");
assert.equal(intake.policy.descriptiveOnlyBoundary, true, "release metadata dry-run should preserve descriptive-only boundary");

const result = applicationPlan.map((step) => {
  const fields = step.requiredFields.map((fieldId) => fieldState(step.section, fieldId));
  const missing = fields.filter((field) => !isApproved(field));
  return {
    id: step.id,
    title: step.title,
    status: missing.length === 0 ? "ready_for_dedicated_apply_pass" : "blocked_pending_metadata",
    targets: step.targets,
    dryRunChanges: step.dryRunChanges,
    missingFields: missing.map((field) => field.id)
  };
});

const blocked = result.filter((step) => step.status === "blocked_pending_metadata");

assert.equal(blocked.length, applicationPlan.length, "all release application steps should remain blocked until metadata is approved");

console.log("dry_run_release_metadata_application: blocked");
console.log(`product: ${intake.product}`);
console.log(`slug: ${intake.slug}`);
for (const step of result) {
  console.log(`- ${step.id}: ${step.status}`);
  console.log(`  targets: ${step.targets.join(", ")}`);
  console.log(`  missing: ${step.missingFields.join(", ") || "none"}`);
  console.log(`  would_change: ${step.dryRunChanges.join(" | ")}`);
}

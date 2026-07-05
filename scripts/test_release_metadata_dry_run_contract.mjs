import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dryRunScript = await readFile(
  new URL("../scripts/dry_run_release_metadata_application.mjs", import.meta.url),
  "utf8",
);
const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
const appleDoc = await readFile(new URL("../docs/apple-platform-readiness.md", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

const requiredScriptHooks = [
  "dry_run_release_metadata_application: blocked",
  "blocked_pending_metadata",
  "ready_for_dedicated_apply_pass",
  "assert.equal(blocked.length, applicationPlan.length",
  "PRODUCT_BUNDLE_IDENTIFIER",
  "PrivacyInfo.xcprivacy",
  "AppIcon.appiconset",
  "ExportOptions.plist",
  "mac_notarization_decision",
  "doNotCreateReleaseArtifacts",
  "descriptiveOnlyBoundary"
];

for (const hook of requiredScriptHooks) {
  assert.ok(dryRunScript.includes(hook), `dry-run script missing hook: ${hook}`);
}

for (const forbiddenMutation of [
  "writeFile",
  "appendFile",
  "mkdir",
  "rm(",
  "xcodebuild",
  "notarytool",
  "altool"
]) {
  assert.ok(!dryRunScript.includes(forbiddenMutation), `dry-run script should not mutate or submit release artifacts: ${forbiddenMutation}`);
}

for (const hook of [
  '"dry-run:release:metadata": "node scripts/dry_run_release_metadata_application.mjs"',
  "test_release_metadata_dry_run_contract.mjs",
]) {
  assert.ok(packageJson.includes(hook), `package.json missing dry-run metadata hook: ${hook}`);
}

for (const hook of [
  "Release Metadata Application Dry Run",
  "npm run dry-run:release:metadata",
  "dry_run_release_metadata_application.mjs",
  "blocked_pending_metadata",
  "ready_for_dedicated_apply_pass"
]) {
  assert.ok(appleDoc.includes(hook), `Apple readiness doc missing dry-run metadata hook: ${hook}`);
  assert.ok(readme.includes(hook), `README missing dry-run metadata hook: ${hook}`);
}

console.log("test_release_metadata_dry_run_contract: ok");

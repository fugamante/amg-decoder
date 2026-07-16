import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const runScriptUrl = new URL("../script/build_and_run.sh", import.meta.url);
const gitignoreUrl = new URL("../.gitignore", import.meta.url);

await access(runScriptUrl);

const [runScript, gitignore] = await Promise.all([
  readFile(runScriptUrl, "utf8"),
  readFile(gitignoreUrl, "utf8"),
]);

const requiredScriptHooks = [
  'APP_NAME="AMG Decoder"',
  'PRODUCT_NAME="AMGDecoderApp"',
  'BUNDLE_ID="app.amgdecoder.local"',
  'swift build --product "$PRODUCT_NAME"',
  "CFBundleDisplayName",
  "CFBundleExecutable",
  "CFBundleIdentifier",
  "CFBundlePackageType",
  "LSMinimumSystemVersion",
  "NSPrincipalClass",
  "find \"$BUILD_DIR\" -maxdepth 1 -type d -name '*.bundle'",
  "/usr/bin/open -n \"$APP_BUNDLE\"",
  "--verify|verify",
];

for (const needle of requiredScriptHooks) {
  assert.ok(runScript.includes(needle), `script/build_and_run.sh missing ${needle}`);
}

assert.ok(gitignore.includes("dist/"), ".gitignore should exclude staged app bundles");

const prohibitedShippingClaims = [
  "com.fugamante",
  "com.johnny",
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
];

for (const claim of prohibitedShippingClaims) {
  assert.ok(!runScript.includes(claim), `run script contains shipping/signing claim: ${claim}`);
}

console.log("test_apple_packaging_contract: ok");

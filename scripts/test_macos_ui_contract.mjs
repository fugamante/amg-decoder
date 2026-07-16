import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const macosScriptUrl = new URL("../script/check_macos_ui.sh", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);
const readinessUrl = new URL("../docs/apple-platform-readiness.md", import.meta.url);

await Promise.all([
  access(macosScriptUrl),
  access(packageUrl),
  access(readinessUrl),
]);

const [macosScript, packageJson, readiness] = await Promise.all([
  readFile(macosScriptUrl, "utf8"),
  readFile(packageUrl, "utf8"),
  readFile(readinessUrl, "utf8"),
]);

const requiredScriptHooks = [
  'PROCESS_NAME="${PROCESS_NAME:-AMGDecoderApp}"',
  '"$ROOT/script/build_and_run.sh" --verify',
  "System Events",
  "UI elements of targetContainer",
  "set total to total + my linkCount(itemRef)",
  'value of attribute "AXIdentifier"',
  "AMG Decoder process did not launch",
  "AMG Decoder window did not appear",
  "Expected the default Martin analyzer window",
  "sidebar outline was not visible",
  "set size of appWindow to {900, 640}",
  "minimum window",
  "set size of appWindow to {1180, 760}",
  "expanded window",
  "Martin serial analyzer",
  "Ready for a Martin serial",
  "waitForText",
  "textFieldWithIdentifier",
  'textFieldWithIdentifier(detailScroll, "serial-input")',
  "Serial field was not keyboard reachable",
  "set focused of serialField to true",
  'keystroke "2935987"',
  "keystroke return using command down",
  "Command-Return keyboard analysis did not produce a 2024 result",
  "keyboard command analysis",
  'clickButtonWithIdentifier(toolbar 1 of appWindow, "clear-serial-button")',
  "Toolbar Clear button was not reachable after keyboard analysis",
  "Toolbar Clear did not restore the empty Martin result",
  "clickButtonWithIdentifier",
  "sample-serial-2935987",
  "Supported sample button was not reachable",
  "HIGH confidence",
  "Production year 2024",
  "martin.standard_guitars_ukuleles.1898_2025",
  "Toolbar Analyze button was not reachable after sample analysis",
  'clickButtonWithIdentifier(toolbar 1 of appWindow, "analyze-serial-button")',
  "source link was not visible",
  "Serial lookup returns a production year by official range, not an exact build date.",
  "Serial results do not establish authenticity, model identity, or value.",
  "pkill -x \"$PROCESS_NAME\"",
];

for (const hook of requiredScriptHooks) {
  assert.ok(macosScript.includes(hook), `script/check_macos_ui.sh missing ${hook}`);
}

const requiredPackageHooks = [
  '"test:macos:ui": "script/check_macos_ui.sh"',
  "test_macos_ui_contract.mjs",
];

for (const hook of requiredPackageHooks) {
  assert.ok(packageJson.includes(hook), `package.json missing ${hook}`);
}

const requiredReadinessHooks = [
  "macOS UI assertion path",
  "npm run test:macos:ui",
  "Martin production-year result",
  "Source link",
  "minimum-size window",
  "expanded window",
  "toolbar Analyze",
  "accessibility labels",
  "reduced transparency",
  "Dynamic Type",
  "VoiceOver",
  "descriptive-only footer",
];

for (const hook of requiredReadinessHooks) {
  assert.ok(readiness.includes(hook), `docs/apple-platform-readiness.md missing ${hook}`);
}

const prohibitedShippingClaims = [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "ASSETCATALOG_COMPILER_APPICON_NAME",
  "PrivacyInfo.xcprivacy",
];

for (const claim of prohibitedShippingClaims) {
  assert.ok(!macosScript.includes(claim), `macOS UI script contains premature release metadata: ${claim}`);
}

console.log("test_macos_ui_contract: ok");

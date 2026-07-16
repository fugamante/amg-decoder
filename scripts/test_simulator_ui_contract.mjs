import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const projectUrl = new URL("../AMGDecoder.xcodeproj/project.pbxproj", import.meta.url);
const schemeUrl = new URL("../AMGDecoder.xcodeproj/xcshareddata/xcschemes/AMGDecoderApp-iOS.xcscheme", import.meta.url);
const scriptUrl = new URL("../script/check_simulator_ui.sh", import.meta.url);
const iphoneScriptUrl = new URL("../script/check_simulator_iphone_ui.sh", import.meta.url);
const testUrl = new URL("../Tests/AMGDecoderUITests/AMGDecoderUITests.swift", import.meta.url);

await Promise.all([
  access(projectUrl),
  access(schemeUrl),
  access(scriptUrl),
  access(iphoneScriptUrl),
  access(testUrl),
]);

const [project, scheme, script, iphoneScript, test] = await Promise.all([
  readFile(projectUrl, "utf8"),
  readFile(schemeUrl, "utf8"),
  readFile(scriptUrl, "utf8"),
  readFile(iphoneScriptUrl, "utf8"),
  readFile(testUrl, "utf8"),
]);

const requiredProjectHooks = [
  "AMGDecoderUITests",
  "AMGDecoderUITests.swift",
  "com.apple.product-type.bundle.ui-testing",
  "TEST_TARGET_NAME = \"AMGDecoderApp-iOS\";",
  "PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.uitests;",
];

for (const hook of requiredProjectHooks) {
  assert.ok(project.includes(hook), `Xcode project missing UI test hook: ${hook}`);
}

const requiredSchemeHooks = [
  "<TestAction",
  "AMGDecoderUITests.xctest",
  'BlueprintName = "AMGDecoderUITests"',
];

for (const hook of requiredSchemeHooks) {
  assert.ok(scheme.includes(hook), `iOS scheme missing UI test hook: ${hook}`);
}

const requiredScriptHooks = [
  'PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"',
  'IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"',
  "xcodebuild",
  "F0D1D633-611F-4D8D-9571-E1574E065EE0",
  "iPad UI assertions",
  "UI_TEST_LABEL",
  "ONLY_TESTING",
  "UI_TEST_TIMEOUT_SECONDS",
  'APP_BUNDLE_ID="${APP_BUNDLE_ID:-app.amgdecoder.local.ios}"',
  'TEST_RUNNER_BUNDLE_ID="${TEST_RUNNER_BUNDLE_ID:-app.amgdecoder.local.uitests.xctrunner}"',
  'xcrun simctl boot "$SIMULATOR_ID"',
  'xcrun simctl bootstatus "$SIMULATOR_ID" -b',
  'xcrun simctl terminate "$SIMULATOR_ID" "$APP_BUNDLE_ID"',
  'xcrun simctl terminate "$SIMULATOR_ID" "$TEST_RUNNER_BUNDLE_ID"',
  "sleep 2",
  "Timed out",
  "kill -TERM",
  "kill -KILL",
  "-resultBundlePath",
  "test",
  "dist/simulator-ui/AMGDecoderUITests.xcresult",
];

for (const hook of requiredScriptHooks) {
  assert.ok(script.includes(hook), `script/check_simulator_ui.sh missing ${hook}`);
}

const requiredIPhoneScriptHooks = [
  "E642B86F-F915-4992-9D3F-17332147755B",
  "compact_iphone",
  "compact iPhone UI assertions",
  "testCompactIPhoneNavigationAnalyzerFlow",
  "dist/simulator-iphone-ui/AMGDecoderCompactIPhoneUITests.xcresult",
  "script/check_simulator_ui.sh",
];

for (const hook of requiredIPhoneScriptHooks) {
  assert.ok(iphoneScript.includes(hook), `script/check_simulator_iphone_ui.sh missing ${hook}`);
}

const requiredTestHooks = [
  "XCUIApplication",
  "testCompactIPhoneNavigationAnalyzerFlow",
  "UIDevice.current.userInterfaceIdiom == .phone",
  "Compact iPhone should start on the brand list.",
  "brand-row-suhr",
  "brand-row-novo",
  "brand-sidebar",
  "brand-link-\\(brand)",
  "serial-input",
  "form-analyze-button",
  "analyzer-result",
  "Production year 2024",
  "Production range 2017-2018",
  "Fender Japan JD-prefix context required",
  "brand-row-\\(brand)",
  "selectBrand(\"fender\"",
  "MX17123456",
  "JD12123456",
  "fender.mx_2010_2017.mx_prefix",
  "fender.jp_2012_present.jd_context_required",
  "How can I find out when my Mexican-made instrument was manufactured?",
  "How can I find out when my Japanese-made instrument was manufactured?",
  "Confirm Made in Japan decal",
  "C. F. Martin & Co. Serial/Date Lookup",
  "Serial results do not establish authenticity, model identity, or value.",
];

for (const hook of requiredTestHooks) {
  assert.ok(test.includes(hook), `AMGDecoderUITests missing assertion hook: ${hook}`);
}

const prohibitedClaims = [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "com.fugamante",
  "com.johnny",
];

for (const claim of prohibitedClaims) {
  assert.ok(!project.includes(claim), `Xcode project contains premature signing or identity claim: ${claim}`);
  assert.ok(!scheme.includes(claim), `iOS scheme contains premature signing or identity claim: ${claim}`);
  assert.ok(!script.includes(claim), `UI script contains premature signing or identity claim: ${claim}`);
  assert.ok(!iphoneScript.includes(claim), `iPhone UI script contains premature signing or identity claim: ${claim}`);
}

console.log("test_simulator_ui_contract: ok");

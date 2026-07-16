import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const readinessScriptUrl = new URL("../script/check_xcode_readiness.sh", import.meta.url);

await access(readinessScriptUrl);

const script = await readFile(readinessScriptUrl, "utf8");

const requiredHooks = [
  'PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"',
  'IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"',
  'MACOS_SCHEME="${MACOS_SCHEME:-AMGDecoderApp-macOS}"',
  'MAC_DESTINATION="${MAC_DESTINATION:-platform=macOS}"',
  'IPHONE_DESTINATION="${IPHONE_DESTINATION:-platform=iOS Simulator,name=iPhone 17,OS=26.5}"',
  'IPAD_DESTINATION="${IPAD_DESTINATION:-platform=iOS Simulator,name=iPad (A16),OS=26.5}"',
  "xcodebuild -version",
  "xcode-select -p",
  'xcodebuild -list -project "$PROJECT"',
  'xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -showdestinations',
  'xcodebuild -project "$PROJECT" -scheme "$MACOS_SCHEME" -showdestinations',
  'xcodebuild -project "$PROJECT" -scheme "$MACOS_SCHEME" -destination "$MAC_DESTINATION" build',
  'xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -destination "$IPHONE_DESTINATION" build',
  'xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -destination "$IPAD_DESTINATION" build',
];

for (const hook of requiredHooks) {
  assert.ok(script.includes(hook), `script/check_xcode_readiness.sh missing ${hook}`);
}

const prohibitedClaims = [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "PRODUCT_BUNDLE_IDENTIFIER=com.",
  "App Store",
];

for (const claim of prohibitedClaims) {
  assert.ok(!script.includes(claim), `Xcode readiness script contains premature shipping claim: ${claim}`);
}

console.log("test_xcode_readiness_contract: ok");

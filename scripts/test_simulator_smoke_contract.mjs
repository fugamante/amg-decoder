import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const scriptUrl = new URL("../script/check_simulator_smoke.sh", import.meta.url);
await access(scriptUrl);

const script = await readFile(scriptUrl, "utf8");

const requiredHooks = [
  'PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"',
  'IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"',
  'BUNDLE_ID="${BUNDLE_ID:-app.amgdecoder.local.ios}"',
  'SMOKE_SETTLE_SECONDS="${SMOKE_SETTLE_SECONDS:-4}"',
  "xcodebuild",
  "xcrun simctl bootstatus",
  "xcrun simctl install",
  "xcrun simctl launch",
  'sleep "$SMOKE_SETTLE_SECONDS"',
  'rm -f "$SCREENSHOT_PATH"',
  "xcrun simctl io",
  "screenshot",
  "PlistBuddy",
  "AMG Decoder.app",
];

for (const hook of requiredHooks) {
  assert.ok(script.includes(hook), `script/check_simulator_smoke.sh missing ${hook}`);
}

const prohibitedClaims = [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "com.fugamante",
  "com.johnny",
];

for (const claim of prohibitedClaims) {
  assert.ok(!script.includes(claim), `simulator smoke script contains premature signing or identity claim: ${claim}`);
}

console.log("test_simulator_smoke_contract: ok");

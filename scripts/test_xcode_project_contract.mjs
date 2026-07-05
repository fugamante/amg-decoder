import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const projectUrl = new URL("../AMGDecoder.xcodeproj/project.pbxproj", import.meta.url);
const iosSchemeUrl = new URL("../AMGDecoder.xcodeproj/xcshareddata/xcschemes/AMGDecoderApp-iOS.xcscheme", import.meta.url);
const macSchemeUrl = new URL("../AMGDecoder.xcodeproj/xcshareddata/xcschemes/AMGDecoderApp-macOS.xcscheme", import.meta.url);
const assetCatalogUrl = new URL("../AppAssets/Assets.xcassets/Contents.json", import.meta.url);
const accentColorUrl = new URL("../AppAssets/Assets.xcassets/AccentColor.colorset/Contents.json", import.meta.url);

await Promise.all([
  access(projectUrl),
  access(iosSchemeUrl),
  access(macSchemeUrl),
  access(assetCatalogUrl),
  access(accentColorUrl),
]);

const [project, iosScheme, macScheme, accentColor] = await Promise.all([
  readFile(projectUrl, "utf8"),
  readFile(iosSchemeUrl, "utf8"),
  readFile(macSchemeUrl, "utf8"),
  readFile(accentColorUrl, "utf8"),
]);

const requiredProjectHooks = [
  "AMGDecoderApp-iOS",
  "AMGDecoderApp-macOS",
  "XCLocalSwiftPackageReference",
  "relativePath = .;",
  "productName = AnalyzerCore;",
  "Sources/AMGDecoderApp/AMGDecoderApp.swift",
  "AppAssets/Assets.xcassets",
  "Assets.xcassets in Resources",
  "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;",
  'PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.ios;',
  'PRODUCT_BUNDLE_IDENTIFIER = app.amgdecoder.local.macos;',
  'INFOPLIST_KEY_CFBundleDisplayName = "AMG Decoder";',
  'SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";',
  "SUPPORTED_PLATFORMS = macosx;",
  'TARGETED_DEVICE_FAMILY = "1,2";',
];

for (const hook of requiredProjectHooks) {
  assert.ok(project.includes(hook), `AMGDecoder.xcodeproj missing ${hook}`);
}

assert.ok(iosScheme.includes('BlueprintName = "AMGDecoderApp-iOS"'), "iOS scheme should point at the iOS app target");
assert.ok(macScheme.includes('BlueprintName = "AMGDecoderApp-macOS"'), "macOS scheme should point at the macOS app target");
assert.ok(accentColor.includes('"color-space": "srgb"'), "AccentColor asset should declare an sRGB color");
assert.ok(!project.includes("ASSETCATALOG_COMPILER_APPICON_NAME"), "Xcode project should not claim a final app icon set yet");

const prohibitedClaims = [
  "DEVELOPMENT_TEAM",
  "PROVISIONING_PROFILE",
  "CODE_SIGN_IDENTITY",
  "com.fugamante",
  "com.johnny",
];

for (const claim of prohibitedClaims) {
  assert.ok(!project.includes(claim), `Xcode project contains premature signing or identity claim: ${claim}`);
  assert.ok(!iosScheme.includes(claim), `iOS scheme contains premature signing or identity claim: ${claim}`);
  assert.ok(!macScheme.includes(claim), `macOS scheme contains premature signing or identity claim: ${claim}`);
}

console.log("test_xcode_project_contract: ok");

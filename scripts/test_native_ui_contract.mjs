import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
  new URL("../Sources/AMGDecoderApp/AMGDecoderApp.swift", import.meta.url),
  "utf8",
);
const resourceLoaderSource = await readFile(
  new URL("../Sources/AnalyzerCore/ResourceLoader.swift", import.meta.url),
  "utf8",
);

const requiredNativeUiHooks = [
  "NavigationSplitView",
  "ToolbarItemGroup",
  "ViewThatFits",
  "GeometryReader",
  "FocusState",
  ".fixedSize(horizontal: false, vertical: true)",
  ".multilineTextAlignment(.leading)",
  ".textSelection(.enabled)",
  "@Environment(\\.horizontalSizeClass)",
  "FooterPlacement",
  ".navigationSplitViewColumnWidth(min: 160, ideal: 176, max: 196)",
  ".navigationSplitViewColumnWidth(min: 220, ideal: 238, max: 260)",
  "enum AnalyzerRoute",
  'keyboardShortcut(.return, modifiers: .command)',
  'accessibilityIdentifier("brand-sidebar")',
  'accessibilityIdentifier("brand-link-\\(brand.rawValue)")',
  'accessibilityIdentifier("brand-row-\\(brand.rawValue)")',
  'accessibilityHint("Opens the \\(metadata.displayName) serial analyzer")',
  'accessibilityHint("Selects the \\(metadata.displayName) serial analyzer")',
  'accessibilityIdentifier("analyzer-detail")',
  'accessibilityIdentifier("serial-form")',
  'accessibilityIdentifier("serial-input")',
  'accessibilityLabel("\\(brandDisplayName) serial analyzer form")',
  'accessibilityLabel("\\(brandDisplayName) serial number")',
  'accessibilityHint("Runs source-backed \\(brandDisplayName) serial analysis")',
  'accessibilityIdentifier("sample-serial-\\(sample.serial)")',
  'accessibilityIdentifier("analyzer-result")',
  "resultAccessibilityLabel",
  'accessibilityIdentifier("scope-strip")',
  'accessibilityLabel("\\(brandDisplayName) analyzer scope")',
  'accessibilityIdentifier("product-boundary-footer")',
  "Reviewed source data: 2026-06-23. Serial results do not establish authenticity, model identity, or value.",
  ".accessibilitySortPriority(3)",
  ".accessibilitySortPriority(2)",
  ".accessibilitySortPriority(1)",
  "Japan JD",
  "Japan date decoding",
  "Scoped U.S., Mexico, Indonesia, and Japan-context Fender instruments",
  "Serial results do not establish authenticity, model identity, or value.",
  "manifest.activeBrand(for: brand)",
  "BrandRow(brand: brand, metadata:",
  "EmptyResultView(metadata:",
];

for (const needle of requiredNativeUiHooks) {
  assert.ok(appSource.includes(needle), `native SwiftUI shell missing ${needle}`);
}

const retiredNativeHooks = [
  "enum ResearchBrand",
  "ResearchDetail",
  "ResearchRow",
  "Suhr research guidance",
  "Novo research guidance",
];

for (const needle of retiredNativeHooks) {
  assert.ok(!appSource.includes(needle), `retired research brand should not remain in native UI: ${needle}`);
}

const prohibitedClaims = [
  "authentic instrument",
  "authenticated",
  "appraisal",
  "market value",
  "recommended",
];

for (const claim of prohibitedClaims) {
  assert.ok(!appSource.toLowerCase().includes(claim), `native SwiftUI shell contains prohibited claim: ${claim}`);
}

assert.ok(!resourceLoaderSource.includes("public var displayName"), "BrandID display names should come from active-brands.json");
assert.ok(!resourceLoaderSource.includes("public var status"), "BrandID status labels should come from active-brands.json");

console.log("test_native_ui_contract: ok");

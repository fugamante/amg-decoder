import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [manifestText, html, appJs, nativeSource, brandSource, registryText, roadmap] = await Promise.all([
  read("../data/active-brands.json"),
  read("../web/index.html"),
  read("../web/app.js"),
  read("../Sources/AMGDecoderApp/AMGDecoderApp.swift"),
  read("../Sources/AnalyzerCore/ResourceLoader.swift"),
  read("../data/source-registry.json"),
  read("../serial-analyzer-roadmap.md"),
]);

const manifest = JSON.parse(manifestText);
const registry = JSON.parse(registryText);
const activeBrands = manifest.active_brands.map((brand) => brand.id);
const retiredBrands = manifest.excluded_brands.map((brand) => brand.id);
const dataBrandDirs = (await readdir(new URL("../data/brands/", import.meta.url), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.equal(manifest.schema_version, 1, "active brand manifest schema version should remain explicit");
assert.equal(manifest.product_name, "AMG Decoder", "active brand manifest should name the product");
assert.ok(activeBrands.length > 0, "active brand manifest should list active brands");
assert.equal(new Set(activeBrands).size, activeBrands.length, "active brand ids should be unique");
assert.deepEqual(retiredBrands.sort(), ["novo", "suhr"], "retired brand ids should remain explicit in the manifest");

for (const brand of manifest.active_brands) {
  assert.equal(brand.surface, "analyzer", `active brand ${brand.id} should be an analyzer surface`);
  await access(new URL(`../${brand.data_path}`, import.meta.url));
}

for (const brand of manifest.excluded_brands) {
  const reason = brand.reason.toLowerCase();
  assert.equal(brand.status, "retired", `excluded brand ${brand.id} should be retired`);
  assert.ok(reason.includes("provenance-only"), `${brand.id} exclusion should preserve provenance-only rationale`);
  assert.ok(reason.includes("no reviewed official public serial-decoding rule"), `${brand.id} exclusion should avoid decoder implication`);
}

assert.deepEqual(dataBrandDirs, [...activeBrands].sort(), "data/brands should contain only active product-surface brands");

const htmlBrands = [...html.matchAll(/data-brand="([^"]+)"/g)].map((match) => match[1]).sort();
assert.deepEqual(htmlBrands, [], "web brand navigation should be hydrated from the manifest, not hard-coded HTML");
assert.ok(html.includes("data-brand-list"), "web brand rail should expose a manifest-hydrated brand list container");
assert.equal([...html.matchAll(/data-research=/g)].length, 0, "web navigation should not expose research-only rows");

const brandConfigBlock = appJs.match(/const brandConfig = \{([\s\S]*?)\n\};\n\nconst state = \{/);
assert.ok(brandConfigBlock, "web/app.js should expose a parseable brandConfig block");
const configuredBrands = [...brandConfigBlock[1].matchAll(/\n  ([a-z]+): \{/g)].map((match) => match[1]).sort();
assert.deepEqual(configuredBrands, [...activeBrands].sort(), "web brandConfig should match active brands");

const pathBlock = appJs.match(/const paths = \{([\s\S]*?)\n\};\n\nconst brandConfig = \{/);
assert.ok(pathBlock, "web/app.js should expose a parseable paths block");
const pathBrands = [...pathBlock[1].matchAll(/\n  ([a-z]+): /g)]
  .map((match) => match[1])
  .filter((brand) => !["manifest", "registry"].includes(brand))
  .sort();
assert.deepEqual(pathBrands, [...activeBrands].sort(), "web data paths should match active brands");
assert.ok(appJs.includes("renderBrandNavigation"), "web runtime should render brand navigation from the manifest");
assert.ok(appJs.includes("state.manifest.active_brands"), "web runtime should use active brand manifest entries");

const brandEnum = brandSource.match(/public enum BrandID[\s\S]*?\n\}/);
assert.ok(brandEnum, "native BrandID enum should be parseable");
const nativeBrands = [...brandEnum[0].matchAll(/\n    case ([a-z]+)/g)].map((match) => match[1]).sort();
assert.deepEqual(nativeBrands, [...activeBrands].sort(), "native BrandID cases should match active brands");

for (const retiredBrand of retiredBrands) {
  const visiblePattern = new RegExp(retiredBrand, "i");
  assert.ok(!visiblePattern.test(html), `retired brand ${retiredBrand} should not appear in web/index.html`);
  assert.ok(!visiblePattern.test(appJs), `retired brand ${retiredBrand} should not appear in web/app.js`);
  assert.ok(!visiblePattern.test(nativeSource), `retired brand ${retiredBrand} should not appear in native UI source`);
  assert.ok(!dataBrandDirs.includes(retiredBrand), `retired brand ${retiredBrand} should not have active data brand directory`);
  assert.match(roadmap, new RegExp(`\\| ${retiredBrand[0].toUpperCase()}${retiredBrand.slice(1)} \\|[^\\n]*\\| Retired \\|`, "i"));
}

for (const sourceId of ["suhr_warranty_registration", "novo_warranty"]) {
  const source = registry.sources.find((entry) => entry.id === sourceId);
  assert.ok(source, `source registry should retain retired provenance source ${sourceId}`);
  const sourceText = JSON.stringify(source).toLowerCase();
  assert.ok(sourceText.includes("retired"), `${sourceId} should be explicitly marked retired`);
  assert.ok(sourceText.includes("provenance"), `${sourceId} should be provenance-only`);
  assert.ok(sourceText.includes("read-only ui rows"), `${sourceId} should prohibit read-only UI rows`);
  assert.ok(sourceText.includes("not a public decoding rule"), `${sourceId} should avoid decoder implication`);
}

const prohibitedVisibleClaims = ["authentic instrument", "authenticated", "appraisal", "market value", "recommended"];
for (const claim of prohibitedVisibleClaims) {
  assert.ok(!html.toLowerCase().includes(claim), `web visible surface contains prohibited claim: ${claim}`);
  assert.ok(!nativeSource.toLowerCase().includes(claim), `native visible surface contains prohibited claim: ${claim}`);
}

console.log("test_active_surface_contract: ok");

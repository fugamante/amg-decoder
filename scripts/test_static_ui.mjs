import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const [html, css, appJs] = await Promise.all([
  read("../web/index.html"),
  read("../web/styles.css"),
  read("../web/app.js"),
]);

const requiredHtml = [
  'class="skip-link"',
  'href="#main"',
  'id="main"',
  'tabindex="-1"',
  'aria-describedby="serial-help"',
  'role="status"',
  'aria-live="polite"',
  'aria-atomic="true"',
  'id="brand-status-note"',
  "data-brand-list",
  "Enabled brands use scoped source-backed rules and fixtures; unavailable families remain excluded until reviewed.",
  "Serial results do not establish authenticity, model identity, or value.",
];

for (const needle of requiredHtml) {
  assert.ok(html.includes(needle), `web/index.html missing ${needle}`);
}

const retiredResearchRows = ['data-research="suhr"', 'data-research="novo"', "Suhr research guidance", "Novo research guidance"];
for (const needle of retiredResearchRows) {
  assert.ok(!html.includes(needle), `retired research brand should not render in web/index.html: ${needle}`);
}

const requiredCss = [
  "color-scheme: light dark",
  "@media (prefers-color-scheme: dark)",
  ".skip-link",
  ":focus-visible",
  "outline-offset",
  "overflow-x: auto",
  "overflow-wrap: anywhere",
  "grid-template-columns: 1fr",
];

for (const needle of requiredCss) {
  assert.ok(css.includes(needle), `web/styles.css missing ${needle}`);
}

const requiredJs = [
  "Source unavailable",
  "resultRegion.focus",
  "preventScroll: true",
  "renderBrandNavigation",
  "state.manifest.active_brands",
  "analyzeTaylorSerial",
  "analyzePrsSerial",
  "analyzeCollingsSerial",
  "Japan JD context",
  "Japan date decoding",
];

for (const needle of requiredJs) {
  assert.ok(appJs.includes(needle), `web/app.js missing ${needle}`);
}

const retiredResearchJs = ["researchConfig", "selectResearch", "renderResearchGuidance", "Suhr", "Novo"];
for (const needle of retiredResearchJs) {
  assert.ok(!appJs.includes(needle), `retired research brand should not remain in web/app.js: ${needle}`);
}

const prohibitedVisibleClaims = [
  "authentic instrument",
  "authenticated",
  "appraisal",
  "market value",
  "recommended",
];

const visibleSurface = html.replace(/<script[\s\S]*?<\/script>/g, "");
for (const claim of prohibitedVisibleClaims) {
  assert.ok(!visibleSurface.toLowerCase().includes(claim), `visible UI contains prohibited claim: ${claim}`);
}

console.log("test_static_ui: ok");

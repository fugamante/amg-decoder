import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeGibsonSerial } from "../web/analyzer.js";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const [rules, registry, fixtures, schema] = await Promise.all([
  json("../data/brands/gibson/rules.json"),
  json("../data/source-registry.json"),
  json("../data/fixtures/gibson_serial_rules.json"),
  json("../schemas/analyzer-result.schema.json"),
]);

for (const fixture of fixtures.cases) {
  const result = analyzeGibsonSerial(fixture.input.serial, rules, registry);
  const caseId = fixture.id;
  assert.ok(schema.confidence_values.includes(result.confidence), `${caseId}: invalid confidence`);
  assert.equal(result.confidence, fixture.expected.confidence, `${caseId}: confidence`);
  assert.equal(result.matched_rule.id, fixture.expected.matched_rule, `${caseId}: matched rule`);
  assert.deepEqual(result.decoded, fixture.expected.decoded, `${caseId}: decoded`);
  assert.ok(result.sources.length > 0, `${caseId}: missing source`);
}

console.log("test_gibson_analyzer: ok");

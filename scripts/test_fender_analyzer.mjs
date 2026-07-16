import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeFenderSerial } from "../web/analyzer.js";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const [rules, registry, fixtures, schema] = await Promise.all([
  json("../data/brands/fender/rules.json"),
  json("../data/source-registry.json"),
  json("../data/fixtures/fender_us_serial_rules.json"),
  json("../schemas/analyzer-result.schema.json"),
]);

for (const fixture of fixtures.cases) {
  const result = analyzeFenderSerial(fixture.input.serial, rules, registry);
  const caseId = fixture.id;
  assert.ok(schema.confidence_values.includes(result.confidence), `${caseId}: invalid confidence`);
  assert.equal(result.confidence, fixture.expected.confidence, `${caseId}: confidence`);
  assert.equal(result.matched_rule.id, fixture.expected.matched_rule, `${caseId}: matched rule`);
  assert.deepEqual(result.decoded, fixture.expected.decoded, `${caseId}: decoded`);
  assert.ok(result.sources.length > 0, `${caseId}: missing source`);
  if (fixture.expected.source_id) {
    assert.equal(result.sources[0].id, fixture.expected.source_id, `${caseId}: source`);
  }
}

console.log("test_fender_analyzer: ok");

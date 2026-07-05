import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeCollingsSerial } from "../web/analyzer.js";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const [collings, registry, fixtures, schema] = await Promise.all([
  json("../data/brands/collings/rules.json"),
  json("../data/source-registry.json"),
  json("../data/fixtures/collings_serial_rules.json"),
  json("../schemas/analyzer-result.schema.json"),
]);

function assertContract(result, caseId) {
  for (const field of schema.required_top_level_fields) {
    assert.ok(Object.hasOwn(result, field), `${caseId}: missing ${field}`);
  }
  assert.ok(schema.confidence_values.includes(result.confidence), `${caseId}: invalid confidence`);
  for (const field of schema.matched_rule.required_fields) {
    assert.ok(Object.hasOwn(result.matched_rule, field), `${caseId}: missing matched_rule.${field}`);
  }
  assert.ok(result.sources.length > 0, `${caseId}: missing sources`);
}

for (const testCase of fixtures.cases) {
  const result = analyzeCollingsSerial(testCase.input.serial, collings, registry);
  assertContract(result, testCase.id);
  assert.equal(result.confidence, testCase.expected.confidence, `${testCase.id}: confidence`);
  assert.equal(result.matched_rule.id, testCase.expected.matched_rule, `${testCase.id}: matched_rule`);
  assert.deepEqual(result.decoded, testCase.expected.decoded, `${testCase.id}: decoded`);
}

console.log("test_collings_analyzer: ok");

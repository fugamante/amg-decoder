import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeMartinSerial } from "../web/analyzer.js";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

const [martin, registry, fixtures, schema] = await Promise.all([
  json("../data/brands/martin/ranges.json"),
  json("../data/source-registry.json"),
  json("../data/fixtures/martin_standard_guitars_ukuleles.json"),
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
  for (const source of result.sources) {
    for (const field of schema.sources.required_fields) {
      assert.ok(Object.hasOwn(source, field), `${caseId}: missing source.${field}`);
    }
  }
}

for (const testCase of fixtures.cases) {
  const result = analyzeMartinSerial(testCase.input.serial, martin, registry);
  assertContract(result, testCase.id);
  assert.equal(result.confidence, testCase.expected.confidence, `${testCase.id}: confidence`);
  assert.equal(result.matched_rule.id, testCase.expected.matched_rule, `${testCase.id}: matched_rule`);
  assert.deepEqual(result.decoded, testCase.expected.decoded, `${testCase.id}: decoded`);
  if (testCase.expected.warnings) {
    for (const warning of testCase.expected.warnings) {
      assert.ok(result.warnings.includes(warning), `${testCase.id}: missing warning`);
    }
  }
}

assert.equal(analyzeMartinSerial(" 2935987 ", martin, registry).input.normalized_serial, "2935987");
assert.equal(analyzeMartinSerial(" 2935987 ", martin, registry).decoded.production_year, 2024);
assert.equal(analyzeMartinSerial("000001", martin, registry).decoded.production_year, 1898);

console.log("test_martin_analyzer: ok");

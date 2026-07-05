#!/usr/bin/env python3
"""Validate source-backed AMG Decoder data artifacts."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_REGISTRY = ROOT / "data" / "source-registry.json"
ACTIVE_BRANDS = ROOT / "data" / "active-brands.json"
MARTIN_RANGES = ROOT / "data" / "brands" / "martin" / "ranges.json"
MARTIN_FIXTURES = ROOT / "data" / "fixtures" / "martin_standard_guitars_ukuleles.json"
TAYLOR_RULES = ROOT / "data" / "brands" / "taylor" / "rules.json"
TAYLOR_FIXTURES = ROOT / "data" / "fixtures" / "taylor_serial_rules.json"
PRS_RULES = ROOT / "data" / "brands" / "prs" / "rules.json"
PRS_FIXTURES = ROOT / "data" / "fixtures" / "prs_set_neck_rules.json"
GIBSON_RULES = ROOT / "data" / "brands" / "gibson" / "rules.json"
GIBSON_FIXTURES = ROOT / "data" / "fixtures" / "gibson_serial_rules.json"
FENDER_RULES = ROOT / "data" / "brands" / "fender" / "rules.json"
FENDER_FIXTURES = ROOT / "data" / "fixtures" / "fender_us_serial_rules.json"
EPIPHONE_RULES = ROOT / "data" / "brands" / "epiphone" / "rules.json"
EPIPHONE_FIXTURES = ROOT / "data" / "fixtures" / "epiphone_serial_rules.json"
COLLINGS_RULES = ROOT / "data" / "brands" / "collings" / "rules.json"
COLLINGS_FIXTURES = ROOT / "data" / "fixtures" / "collings_serial_rules.json"
RESULT_SCHEMA = ROOT / "schemas" / "analyzer-result.schema.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def fail(message: str) -> None:
    print(f"validate_data: {message}", file=sys.stderr)
    raise SystemExit(1)


def warning_for_invalid() -> list[str]:
    return ["Serial is required and must contain digits only."]


def source_by_id(registry: dict, source_id: str) -> dict:
    for source in registry["sources"]:
        if source["id"] == source_id:
            return source
    fail(f"missing source {source_id}")


def martin_result(serial_text: str, data: dict, source: dict) -> dict:
    base = {
        "brand": data["brand"],
        "input": {
            "serial": serial_text,
            "normalized_serial": serial_text if serial_text.isdigit() else None,
        },
        "sources": [
            {
                "id": source["id"],
                "name": source["name"],
                "url": source["url"],
                "source_tier": source["source_tier"],
            }
        ],
    }

    if not serial_text or not serial_text.isdigit():
        return base | {
            "confidence": "unsupported",
            "matched_rule": {
                "id": "input.invalid_serial",
                "label": "Invalid serial input",
            },
            "decoded": {},
            "warnings": warning_for_invalid(),
        }

    serial = int(serial_text)
    for quarantine in data["quarantines"]:
        if quarantine["range_start"] <= serial <= quarantine["range_end"]:
            return base | {
                "confidence": "unsupported",
                "matched_rule": {
                    "id": quarantine["id"],
                    "label": "Sigma-Martin quarantine",
                },
                "decoded": {},
                "warnings": [
                    "Official Martin lookup excludes serials 900001 through 902908 from the 2002 guitar/ukulele range because they were used on Sigma-Martins in 1981-1982."
                ],
            }

    previous_last = 0
    for row in data["ranges"]:
        if serial <= row["last_serial"]:
            return base | {
                "confidence": data["lookup_rule"]["confidence"],
                "matched_rule": {
                    "id": data["rule_id"],
                    "label": data["label"],
                },
                "decoded": {
                    "production_year": row["year"],
                    "range_start": previous_last + 1,
                    "range_end": row["last_serial"],
                },
                "warnings": data["warnings"][:2],
            }
        previous_last = row["last_serial"]

    return base | {
        "confidence": "unsupported",
        "matched_rule": {
            "id": data["rule_id"],
            "label": data["label"],
        },
        "decoded": {},
        "warnings": [
            f"Serial is above the current official Martin guitar/ukulele table reviewed on {data['last_reviewed']}."
        ],
    }


def assert_result_contract(result: dict, schema: dict, case_id: str) -> None:
    for field in schema["required_top_level_fields"]:
        if field not in result:
            fail(f"{case_id}: generated result missing {field}")
    if result["confidence"] not in schema["confidence_values"]:
        fail(f"{case_id}: invalid confidence {result['confidence']}")
    for field in schema["matched_rule"]["required_fields"]:
        if field not in result["matched_rule"]:
            fail(f"{case_id}: matched_rule missing {field}")
    if not isinstance(result["warnings"], list):
        fail(f"{case_id}: warnings must be a list")
    if not result["sources"]:
        fail(f"{case_id}: result must include at least one source")
    for source in result["sources"]:
        for field in schema["sources"]["required_fields"]:
            if field not in source:
                fail(f"{case_id}: source missing {field}")


def assert_sources(registry: dict) -> None:
    if registry.get("schema_version") != 1:
        fail("source registry schema_version must be 1")
    ids = set()
    for source in registry.get("sources", []):
        for field in ("id", "name", "publisher", "url", "source_tier", "last_reviewed", "use"):
            if not source.get(field):
                fail(f"source {source.get('id', '<missing>')} missing {field}")
        if source["id"] in ids:
            fail(f"duplicate source id {source['id']}")
        ids.add(source["id"])
    if "martin_serial_lookup" not in ids:
        fail("source registry missing martin_serial_lookup")
    if "taylor_serial_decode" not in ids:
        fail("source registry missing taylor_serial_decode")
    if "prs_year_identification" not in ids:
        fail("source registry missing prs_year_identification")
    if "gibson_serial_search" not in ids:
        fail("source registry missing gibson_serial_search")
    if "fender_us_product_dating" not in ids:
        fail("source registry missing fender_us_product_dating")
    if "fender_mexico_product_dating" not in ids:
        fail("source registry missing fender_mexico_product_dating")
    if "fender_indonesia_product_dating" not in ids:
        fail("source registry missing fender_indonesia_product_dating")
    if "fender_japan_product_dating" not in ids:
        fail("source registry missing fender_japan_product_dating")
    if "gibson_epiphone_serial_search" not in ids:
        fail("source registry missing gibson_epiphone_serial_search")
    if "collings_faq_serial_numbers" not in ids:
        fail("source registry missing collings_faq_serial_numbers")
    if "suhr_warranty_registration" not in ids:
        fail("source registry missing suhr_warranty_registration")
    if "novo_warranty" not in ids:
        fail("source registry missing novo_warranty")
    registry_text = json.dumps(registry).lower()
    for phrase in (
        "no official public suhr serial-decoding rule",
        "no official public novo serial-decoding rule",
        "dealer examples remain research leads only",
        "retired from the product surface",
        "read-only ui rows",
    ):
        if phrase not in registry_text:
            fail(f"source registry missing research-only boundary phrase: {phrase}")


def assert_active_brands(manifest: dict) -> None:
    expected_active = ["martin", "taylor", "prs", "gibson", "fender", "epiphone", "collings"]
    if manifest.get("schema_version") != 1:
        fail("active brand manifest schema_version must be 1")
    if manifest.get("product_name") != "AMG Decoder":
        fail("active brand manifest product_name must be AMG Decoder")

    active = manifest.get("active_brands", [])
    active_ids = [brand.get("id") for brand in active]
    if active_ids != expected_active:
        fail(f"active brand manifest ids drifted: {active_ids}")
    if len(active_ids) != len(set(active_ids)):
        fail("active brand manifest ids must be unique")

    for brand in active:
        if brand.get("surface") != "analyzer":
            fail(f"active brand {brand.get('id')} must remain an analyzer surface")
        data_path = brand.get("data_path")
        if not data_path or not (ROOT / data_path).is_file():
            fail(f"active brand {brand.get('id')} references missing data_path {data_path}")

    excluded = manifest.get("excluded_brands", [])
    excluded_ids = [brand.get("id") for brand in excluded]
    if excluded_ids != ["suhr", "novo"]:
        fail(f"active brand manifest excluded ids drifted: {excluded_ids}")
    for brand in excluded:
        reason = brand.get("reason", "").lower()
        if brand.get("status") != "retired":
            fail(f"excluded brand {brand.get('id')} must stay retired")
        if "provenance-only" not in reason:
            fail(f"excluded brand {brand.get('id')} must preserve provenance-only reason")
        if "no reviewed official public serial-decoding rule" not in reason:
            fail(f"excluded brand {brand.get('id')} must not imply decoder support")


def assert_result_schema(schema: dict) -> None:
    required = schema.get("required_top_level_fields", [])
    expected = ["brand", "input", "confidence", "matched_rule", "decoded", "warnings", "sources"]
    if required != expected:
        fail("result schema required_top_level_fields drifted")
    if "unsupported" not in schema.get("confidence_values", []):
        fail("result schema must include unsupported confidence")
    if "authentication" not in schema.get("prohibited_claims", []):
        fail("result schema must prohibit authentication claims")


def assert_martin_ranges(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Martin data references unknown source {data.get('source_id')}")
    rows = data.get("ranges", [])
    if len(rows) != 128:
        fail(f"Martin standard table should contain 128 annual rows, found {len(rows)}")
    if rows[0] != {"year": 1898, "last_serial": 8348}:
        fail("Martin first row does not match official 1898 boundary")
    if rows[-1] != {"year": 2025, "last_serial": 3043480}:
        fail("Martin last row does not match official 2025 boundary")

    previous_year = 1897
    previous_last = 0
    for row in rows:
        year = row.get("year")
        last_serial = row.get("last_serial")
        if year != previous_year + 1:
            fail(f"Martin year sequence is not contiguous at {year}")
        if not isinstance(last_serial, int) or last_serial <= previous_last:
            fail(f"Martin last_serial is not increasing at {year}")
        previous_year = year
        previous_last = last_serial

    quarantines = data.get("quarantines", [])
    if len(quarantines) != 1:
        fail("Martin data must keep the Sigma-Martin quarantine explicit")
    quarantine = quarantines[0]
    expected = {
        "id": "martin.sigma_martin_1981_1982",
        "range_start": 900001,
        "range_end": 902908,
        "status": "unsupported",
    }
    for key, value in expected.items():
        if quarantine.get(key) != value:
            fail(f"Martin quarantine {key} drifted")


def assert_martin_fixtures(fixtures: dict, data: dict, registry: dict, schema: dict) -> None:
    if fixtures.get("rule_id") != data.get("rule_id"):
        fail("Martin fixtures reference a different rule_id than Martin ranges")
    source = source_by_id(registry, data["source_id"])
    case_ids = set()
    for case in fixtures.get("cases", []):
        case_id = case.get("id")
        if not case_id:
            fail("fixture case missing id")
        if case_id in case_ids:
            fail(f"duplicate fixture id {case_id}")
        case_ids.add(case_id)
        actual = martin_result(case["input"].get("serial", ""), data, source)
        assert_result_contract(actual, schema, case_id)
        expected = case["expected"]
        for field in ("confidence", "decoded"):
            if actual[field] != expected[field]:
                fail(f"{case_id}: expected {field} {expected[field]!r}, got {actual[field]!r}")
        if actual["matched_rule"]["id"] != expected["matched_rule"]:
            fail(
                f"{case_id}: expected matched_rule {expected['matched_rule']!r}, "
                f"got {actual['matched_rule']['id']!r}"
            )
        if "warnings" in expected:
            for warning in expected["warnings"]:
                if warning not in actual["warnings"]:
                    fail(f"{case_id}: missing expected warning {warning!r}")

    required_cases = {
        "martin_first_supported_serial",
        "martin_sigma_quarantine_lower_boundary",
        "martin_sigma_quarantine_upper_boundary",
        "martin_after_sigma_quarantine",
        "martin_2025_upper_boundary",
        "martin_above_current_authority",
        "martin_reject_empty",
        "martin_reject_non_digits",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Martin fixtures missing required cases: {sorted(missing)}")


def assert_taylor_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Taylor data references unknown source {data.get('source_id')}")
    rules = data.get("rules", [])
    expected_rules = {
        "taylor.current_10_digit.2009_present",
        "taylor.nine_digit.1993_1999",
        "taylor.eleven_digit.2000_2009",
        "taylor.four_prefix_410.1991_1992",
        "taylor.pre_1993_ranges",
    }
    actual_rules = {rule.get("id") for rule in rules}
    if actual_rules != expected_rules:
        fail(f"Taylor rules drifted: {sorted(actual_rules)}")
    if data.get("series_codes", {}).get("3") != "Baby or Big Baby":
        fail("Taylor series code 3 must remain Baby or Big Baby")
    current = next(rule for rule in rules if rule["id"] == "taylor.current_10_digit.2009_present")
    if current.get("factory_codes") != {
        "1": "El Cajon, California, USA",
        "2": "Tecate, Baja California, Mexico",
    }:
        fail("Taylor current factory codes drifted")
    pre_1993 = next(rule for rule in rules if rule["id"] == "taylor.pre_1993_ranges")
    exclusions = pre_1993.get("exclusions", [])
    if not exclusions or exclusions[0].get("id") != "taylor.pre_1993_transition_1977":
        fail("Taylor 1977 transition exclusion must remain explicit")


def assert_taylor_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("Taylor fixtures reference a different source_id than Taylor rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "taylor_current_official_example",
        "taylor_current_mexico_factory",
        "taylor_nine_digit_official_example",
        "taylor_eleven_digit_official_example",
        "taylor_four_prefix_1991_boundary",
        "taylor_four_prefix_1992_boundary",
        "taylor_pre_1993_range",
        "taylor_reject_invalid_date",
        "taylor_reject_empty",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Taylor fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("Taylor fixture ids must be unique")


def assert_prs_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"PRS data references unknown source {data.get('source_id')}")
    if data.get("implemented_scope") != "set_neck_and_s2":
        fail("PRS implemented scope must remain set_neck_and_s2 until another family-specific flow exists")
    rules = {rule.get("id"): rule for rule in data.get("rules", [])}
    if set(rules) != {"prs.set_neck.approximate_ranges", "prs.s2.approximate_ranges"}:
        fail(f"PRS rule ids drifted: {sorted(rules)}")
    rule = rules["prs.set_neck.approximate_ranges"]
    if rule.get("id") != "prs.set_neck.approximate_ranges":
        fail("PRS set-neck rule id drifted")
    ranges = rule.get("ranges", [])
    if not ranges or ranges[0] != {"year": 1985, "range_start": 1, "range_end": 400}:
        fail("PRS first set-neck range drifted")
    if ranges[-1] != {"year": 2024, "range_start": 375043, "range_end": 397950}:
        fail("PRS 2024 set-neck range drifted")
    if any(row.get("year") == 2023 for row in ranges):
        fail("PRS 2023 set-neck range must remain quarantined, not encoded")
    quarantine = rule.get("quarantines", [{}])[0]
    if quarantine.get("id") != "prs.set_neck.2023_authority_anomaly":
        fail("PRS 2023 authority anomaly quarantine missing")
    s2 = rules["prs.s2.approximate_ranges"]
    if s2.get("ranges", [])[0] != {"year": 2013, "range_start": 2000001, "range_end": 2003820}:
        fail("PRS S2 first range drifted")
    if s2.get("ranges", [])[-1] != {"year": 2024, "range_start": 2071820, "range_end": 2078569}:
        fail("PRS S2 2024 range drifted")
    if any(row.get("range_start") <= 2043719 <= row.get("range_end") for row in s2.get("ranges", [])):
        fail("PRS S2 overlap serial S2043719 must remain quarantined, not encoded")
    if s2.get("quarantines", [{}])[0].get("id") != "prs.s2.2019_2020_overlap":
        fail("PRS S2 overlap quarantine missing")


def assert_prs_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("PRS fixtures reference a different source_id than PRS rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "prs_set_neck_1985_lower_boundary",
        "prs_set_neck_2005_prefix_disambiguated",
        "prs_set_neck_2018_two_digit_prefix",
        "prs_set_neck_2024_lower_boundary",
        "prs_set_neck_2023_quarantine",
        "prs_set_neck_reject_prefix_sequence_mismatch",
        "prs_set_neck_reject_empty",
        "prs_s2_2013_lower_boundary",
        "prs_s2_2024_lower_boundary",
        "prs_s2_overlap_quarantine",
        "prs_s2_reject_unmatched",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"PRS fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("PRS fixture ids must be unique")


def assert_gibson_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Gibson data references unknown source {data.get('source_id')}")
    if data.get("implemented_scope") != "official_gibson_guitar_formats":
        fail("Gibson implemented scope must remain official_gibson_guitar_formats")
    expected_rules = {
        "gibson.usa_1977_2005.ydddyrrr",
        "gibson.usa_2005_2014_2019_present.ydddybrrr",
        "gibson.usa_2014_mid_2019.yyrrrrrrr",
        "gibson.centennial_1994.94rrrrrr",
        "gibson.les_paul_classic.1989_2014",
        "gibson.custom_shop.modern_csyrrrr",
        "gibson.custom_shop.reissue.myrrrr",
        "gibson.custom_shop.reissue.yrrrrm",
        "gibson.custom_shop.es_label.a8_a9",
        "gibson.custom_shop.carved_top.ydddyrrr",
    }
    actual_rules = {rule.get("id") for rule in data.get("rules", [])}
    if actual_rules != expected_rules:
        fail(f"Gibson rules drifted: {sorted(actual_rules)}")
    if "ACE" in json.dumps(data):
        fail("Gibson artist signature model codes must not be encoded in production rules")


def assert_gibson_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("Gibson fixtures reference a different source_id than Gibson rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "gibson_usa_1998_8_digit",
        "gibson_usa_2005_9_digit",
        "gibson_usa_2015_model_year",
        "gibson_centennial_1994",
        "gibson_custom_shop_cs",
        "gibson_reject_signature",
        "gibson_reject_invalid_day",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Gibson fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("Gibson fixture ids must be unique")


def assert_fender_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Fender data references unknown source {data.get('source_id')}")
    if data.get("implemented_scope") != "us_mexico_indonesia_made_instruments_with_japan_context_guidance":
        fail("Fender implemented scope must remain us_mexico_indonesia_made_instruments_with_japan_context_guidance")
    expected_rules = {
        "fender.us_1950_1976.serial_ranges",
        "fender.us_1976_1999.s_e_n_prefixes",
        "fender.us_2000_2009.z_dz_prefixes",
        "fender.us_late_2009_2010.ten_prefix",
        "fender.us_2010_present.us_prefix",
        "fender.us_vintage_series.v_prefix",
        "fender.mx_1990_2009.mn_mz_prefixes",
        "fender.mx_2010_2017.mx_prefix",
        "fender.id_2008_2012.ic_icf_prefixes",
        "fender.jp_2012_present.jd_context_required",
    }
    actual_rules = {rule.get("id") for rule in data.get("rules", [])}
    if actual_rules != expected_rules:
        fail(f"Fender rules drifted: {sorted(actual_rules)}")
    for rule in data.get("rules", []):
        source_id = rule.get("source_id", data.get("source_id"))
        if source_id not in source_ids:
            fail(f"Fender rule {rule.get('id')} references unknown source {source_id}")
    text = json.dumps(data)
    for excluded in ("MSN", "MSZ", "AMXN"):
        if excluded in text:
            fail(f"Fender excluded prefix {excluded} must not be encoded")


def assert_fender_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("Fender fixtures reference a different source_id than Fender rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "fender_us_1964_l_prefix",
        "fender_us_1976_numeric",
        "fender_us_s9_overlap",
        "fender_us_dz_deluxe",
        "fender_us_ten_prefix",
        "fender_us_current_prefix",
        "fender_us_v_prefix_context",
        "fender_mx_mn_prefix",
        "fender_mx_mz_prefix",
        "fender_mx_mx_prefix",
        "fender_id_ic_prefix",
        "fender_id_icf_prefix",
        "fender_reject_mexico_transition_decal_scope",
        "fender_reject_unreviewed_non_us_scope",
        "fender_reject_indonesia_post_2012_location_scope",
        "fender_jp_jd_context_required",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Fender fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("Fender fixture ids must be unique")


def assert_epiphone_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Epiphone data references unknown source {data.get('source_id')}")
    if data.get("implemented_scope") != "gibson_documented_epiphone_guitar_formats":
        fail("Epiphone implemented scope must remain gibson_documented_epiphone_guitar_formats")
    expected_rules = {
        "epiphone.regular_production.pre_2008.factory_yymm_rank",
        "epiphone.elite_elitist.fyssss",
        "epiphone.numeric_2008_present.yymmrrrrrr",
    }
    actual_rules = {rule.get("id") for rule in data.get("rules", [])}
    if actual_rules != expected_rules:
        fail(f"Epiphone rules drifted: {sorted(actual_rules)}")
    text = json.dumps(data).lower()
    for factory_name in ("qingdao", "saein", "samick", "unsung"):
        if factory_name in text:
            fail(f"Epiphone factory-name mapping {factory_name} must not be encoded")


def assert_epiphone_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("Epiphone fixtures reference a different source_id than Epiphone rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "epiphone_pre_2008_two_letter_factory",
        "epiphone_pre_2008_one_letter_factory",
        "epiphone_elite_elitist",
        "epiphone_numeric_2008_present",
        "epiphone_reject_invalid_month",
        "epiphone_reject_factory_name_claim",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Epiphone fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("Epiphone fixture ids must be unique")


def assert_collings_rules(data: dict, source_ids: set[str]) -> None:
    if data.get("source_id") not in source_ids:
        fail(f"Collings data references unknown source {data.get('source_id')}")
    if data.get("implemented_scope") != "electric_serials_and_acoustic_guidance":
        fail("Collings implemented scope must remain electric_serials_and_acoustic_guidance")
    expected_rules = {
        "collings.electric.prefix_yy_sequence",
        "collings.acoustic.records_assisted",
    }
    actual_rules = {rule.get("id") for rule in data.get("rules", [])}
    if actual_rules != expected_rules:
        fail(f"Collings rules drifted: {sorted(actual_rules)}")
    prefixes = data.get("electric_prefixes", [])
    for required in ("290", "I35LC"):
        if required not in prefixes:
            fail(f"Collings electric prefixes missing official example prefix {required}")
    if "ship year" not in " ".join(data.get("warnings", [])).lower():
        fail("Collings warnings must preserve production-start versus ship-year boundary")


def assert_collings_fixtures(fixtures: dict, data: dict) -> None:
    if fixtures.get("source_id") != data.get("source_id"):
        fail("Collings fixtures reference a different source_id than Collings rules")
    case_ids = {case.get("id") for case in fixtures.get("cases", [])}
    required_cases = {
        "collings_electric_290_official_example",
        "collings_electric_i35lc_official_example",
        "collings_acoustic_numeric_guidance",
        "collings_reject_empty",
    }
    missing = required_cases - case_ids
    if missing:
        fail(f"Collings fixtures missing required cases: {sorted(missing)}")
    if len(case_ids) != len(fixtures.get("cases", [])):
        fail("Collings fixture ids must be unique")


def main() -> int:
    registry = load_json(SOURCE_REGISTRY)
    active_brands = load_json(ACTIVE_BRANDS)
    martin = load_json(MARTIN_RANGES)
    fixtures = load_json(MARTIN_FIXTURES)
    taylor = load_json(TAYLOR_RULES)
    taylor_fixtures = load_json(TAYLOR_FIXTURES)
    prs = load_json(PRS_RULES)
    prs_fixtures = load_json(PRS_FIXTURES)
    gibson = load_json(GIBSON_RULES)
    gibson_fixtures = load_json(GIBSON_FIXTURES)
    fender = load_json(FENDER_RULES)
    fender_fixtures = load_json(FENDER_FIXTURES)
    epiphone = load_json(EPIPHONE_RULES)
    epiphone_fixtures = load_json(EPIPHONE_FIXTURES)
    collings = load_json(COLLINGS_RULES)
    collings_fixtures = load_json(COLLINGS_FIXTURES)
    schema = load_json(RESULT_SCHEMA)

    assert_sources(registry)
    assert_active_brands(active_brands)
    assert_result_schema(schema)
    source_ids = {source["id"] for source in registry["sources"]}
    assert_martin_ranges(martin, source_ids)
    assert_martin_fixtures(fixtures, martin, registry, schema)
    assert_taylor_rules(taylor, source_ids)
    assert_taylor_fixtures(taylor_fixtures, taylor)
    assert_prs_rules(prs, source_ids)
    assert_prs_fixtures(prs_fixtures, prs)
    assert_gibson_rules(gibson, source_ids)
    assert_gibson_fixtures(gibson_fixtures, gibson)
    assert_fender_rules(fender, source_ids)
    assert_fender_fixtures(fender_fixtures, fender)
    assert_epiphone_rules(epiphone, source_ids)
    assert_epiphone_fixtures(epiphone_fixtures, epiphone)
    assert_collings_rules(collings, source_ids)
    assert_collings_fixtures(collings_fixtures, collings)

    print("validate_data: ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

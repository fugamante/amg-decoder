# PRS Set-Neck and S2 Range Contract

Date: 2026-06-23

Source authority: PRS Guitars, `Year Identification`.

Data artifact: `data/brands/prs/rules.json`.

Fixture artifact: `data/fixtures/prs_set_neck_rules.json`.

Analyzer module: `web/analyzer.js`.

## Scope

This contract covers PRS set-neck and S2 serial ranges from the official PRS year-identification page.

The set-neck lookup rule is:

1. Normalize input as digits only.
2. Match the documented year-code prefix.
3. Interpret remaining digits as the set-neck sequential number.
4. Return the official approximate production-year range only when the prefix year and sequence range agree.

The S2 lookup rule is:

1. Normalize input as an `S2` prefix followed by digits.
2. Compare the official S2 serial number range after the `S` prefix.
3. Return the official approximate production-year range only when the serial falls in a non-quarantined row.

## Quarantines

The official 2023 set-neck row is not encoded. Its published range text appears inconsistent with adjacent 2022 and 2024 rows, so `prs.set_neck.2023_authority_anomaly` remains unsupported until clarified by authority evidence.

The official S2 serial `S2043719` is not encoded because PRS assigns that boundary serial to both the 2019 and 2020 rows. It remains unsupported as `prs.s2.2019_2020_overlap` until clarified by authority evidence.

## Out of Scope

PRS documents many additional serial families, including CE, EG, Swamp Ash Special, bass, SE, acoustics, amplifiers, and cabinets. Those require separate family-specific flows and fixtures before UI enablement.

## Output Boundary

The module may return approximate production year, family, year prefix, sequence or serial number, matched range, serial location, warnings, and source attribution. It must not return authentication, exact model identity, value, or ownership/service conclusions.

## Executable Checks

Run:

```sh
npm test
```

The PRS fixture test verifies boundary examples, prefix disambiguation, the 2023 set-neck quarantine, S2 ranges, S2 overlap quarantine, invalid input, and prefix/sequence mismatches.

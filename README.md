# Guitar Serial Analyzer

A planning workspace for a brand-first guitar serial analyzer.

The project direction is to move beyond a single Gibson-focused decoder into a deterministic analyzer organized by brand. Users should choose a brand first, enter only the fields that matter for that brand, and receive a structured result with confidence, matched rule, warnings, and source attribution.

## Current Scope

- Gibson Custom Shop rule notes and test matrix.
- Product roadmap for a broader serial analyzer.
- First research slice for major electric and acoustic guitar brands.

## Product Principles

- Brand-first analysis instead of broad serial guessing.
- Visible confidence for every result.
- Source-backed rules.
- Explicit warnings for overlapping, ambiguous, or unsupported serial systems.
- No claim of instrument authentication from serial number alone.

## Documents

- `serial-analyzer-roadmap.md`: product and implementation roadmap.
- `brand-research-slice-001.md`: first source-backed brand research slice.
- `interaction-summary.md`: current Gibson decoder findings.
- `test-matrix.md`: Gibson-focused test matrix.

## Recommended Next Work

1. Stabilize the Gibson parser and executable tests.
2. Add Taylor as the first non-Gibson brand module.
3. Add Martin range lookup.
4. Add PRS prefix and range handling.
5. Continue research before adding higher-ambiguity brands such as Fender, Ibanez, Epiphone, Yamaha, and Takamine.

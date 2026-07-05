# Taylor Serial Rule Contract

Date: 2026-06-23

Source authority: Taylor Guitars, `Decoding a Taylor Guitar's Serial #`.

Data artifact: `data/brands/taylor/rules.json`.

Fixture artifact: `data/fixtures/taylor_serial_rules.json`.

Analyzer module: `web/analyzer.js`.

## Scope

This contract covers Taylor serial formats explicitly documented by Taylor:

- Current 10-digit serials beginning in November 2009.
- 9-digit serials from 1993 through 1999.
- 11-digit serials from January 2000 through October 2009.
- `4-` prefix serials for the early 410 numbering system in 1991 and 1992.
- Published pre-1993 serial ranges where the official row is unambiguous.

## Encoded Fields

Depending on the matched format, Taylor results may return:

- Factory for current 10-digit serials.
- Start date or production year.
- Series code label when Taylor documents one for the format.
- Production sequence or matched range.
- Source attribution and warnings.

## Explicit Exclusion

The 1977 transition row is not encoded. Taylor's table describes a mid-year switch from five-digit to three-digit serials, and this project keeps that row unsupported until row-level boundaries can be represented without ambiguity.

## Output Boundary

The module may return descriptive production/start facts from official Taylor serial rules. It must not return authentication, value, exact model identity, warranty eligibility, or repair/service conclusions.

## Executable Checks

Run:

```sh
npm test
```

The Taylor fixture test verifies official examples, boundary examples, invalid dates, unsupported current-format dates, unknown factory codes, and unmatched serials.

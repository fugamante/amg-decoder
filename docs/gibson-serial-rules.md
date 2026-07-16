# Gibson Serial Rules

Date: 2026-06-23

Canonical data artifact: `data/brands/gibson/rules.json`.

Fixture contract: `data/fixtures/gibson_serial_rules.json`.

Source authority: official Gibson serial-number page, source id `gibson_serial_search`.

## Implemented Scope

The Gibson module covers scoped guitar formats documented by Gibson:

- Gibson USA, Gibson Acoustic, and Gibson Memphis 8-digit `YDDDYRRR`.
- Gibson USA 9-digit `YDDDYBRRR`.
- Gibson USA 2014-mid 2019 model-year-only `YYRRRRRRR`.
- 1994 Centennial `94RRRRRR`.
- Les Paul Classic exception metadata.
- Gibson Custom Shop modern `CSYRRRR`.
- Gibson Custom Shop reissue `MYRRRR`/`M YRRR`.
- Gibson Custom Shop ES label `A8YRRRR`/`A9YRRRR`.

## Exclusions

Artist signature, Epiphone, Dobro, banjo, and undocumented exception formats are not enabled in this module. Gibson explicitly says artist signature models often deviate from standard serial formats and directs users to contact Gibson.

Custom Shop formats that encode only a final production-year digit return `production_year_digit`, not a full `production_year`, unless another reviewed authority supports the decade.

## Product Boundary

The module may return documented production year, production-year digit, day-of-year, rank, batch, sequence, model-year hint, model hint, warnings, and source attribution. It must not return authentication, valuation, ownership, legal status, or unsupported exact model identity.

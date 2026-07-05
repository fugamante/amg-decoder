# Fender Serial Rules

Date: 2026-06-27

Canonical data artifact: `data/brands/fender/rules.json`.

Fixture contract: `data/fixtures/fender_us_serial_rules.json`.

Compatibility note: the fixture filename keeps its original U.S. name to avoid churn in test and resource paths; the fixture contents now cover the checked U.S., Mexico, Indonesia, and Japan-context Fender contract.

Source authorities:

- Official Fender American-made instrument dating page, source id `fender_us_product_dating`.
- Official Fender Mexican-made instrument dating page, source id `fender_mexico_product_dating`.
- Official Fender Indonesian-made instrument dating page, source id `fender_indonesia_product_dating`.
- Official Fender Japanese-made instrument dating page, source id `fender_japan_product_dating`.

## Implemented Scope

The Fender module covers scoped U.S.-made instrument serial schemes from Fender's official American-made support page:

- Early numeric and L-prefix serial ranges through 1976.
- S/E/N-prefix U.S. ranges through the 1990s.
- Z/DZ-prefix 2000s ranges.
- Short-lived `10 ` prefix from late 2009 through March 2010.
- `USYY` modern U.S.-made serial format.
- V-prefix U.S. Vintage/American Vintage candidate format, with required neck-heel date context for any specific year.

It also covers the scoped Mexican-made instrument formats explicitly charted by Fender:

- `MN0` through `MN9` plus five or six digits for 1990-2000 production-year ranges.
- `MZ0` through `MZ9` plus five or six digits for 2000-2010 production-year ranges.
- `MX10` through `MX17` plus six digits for 2010-2018 production-year ranges.

It also covers the scoped Indonesian-made instrument formats explicitly charted by Fender:

- `IC08` plus six digits for the 2008-2009 production-year range.
- `IC09` and `ICF09` plus six digits for the 2009-2010 production-year range.
- `IC10` and `ICF10` plus six digits for the 2010-2011 production-year range.
- `ICF11` plus six digits for the 2011-2012 production-year range.

It also includes non-decoding Japan context guidance:

- `JD` plus eight digits returns unsupported context guidance requiring a confirmed `Made in Japan` serial number decal and 2012 transition-period review before dating.

## Exclusions

Custom Shop, Korea, acoustic, amplifier, export, and special-run serials remain excluded until separate source-backed flows exist.

The Mexico late-2009 `10` transition format remains excluded because Fender states those serial numbers do not identify country of origin in the body of the number and require the headstock decal for country context. Mexican-made exception prefixes and shared-origin cases such as artist-model exceptions and California Series `AMXN` also remain excluded.

Indonesia post-2012 serial-location guidance remains excluded because Fender's Indonesian-made support article does not provide a reviewed serial-to-date table beyond the listed IC/ICF rows.

Japanese-made production-year decoding remains excluded because Fender's Japan article depends on `Made in Japan` versus `Crafted in Japan` decal context, overlapping letter prefixes, age-related specifications, and transition-period exceptions. The current Japan helper must not return a production year.

Fender warns that serial-number dating is not precisely definitive because of modular production and overlapping ranges. Range-based Fender results therefore use `production_year_range` and medium confidence.

Fender states that the only way to definitively date U.S. instruments with V-prefix serial numbers is to check the neck heel production date. The module returns a low-confidence `1982-present` V-prefix candidate result and visible `required_context`, not an exact year.

## Product Boundary

The module may return approximate production year or production-year range, prefix, scoped country evidence, scoped factory evidence, unit identifier, sequence, required context, warnings, and source attribution. It must not return authentication, valuation, exact production date, exact model identity, warranty eligibility, or country of origin outside the scoped serial-prefix evidence.

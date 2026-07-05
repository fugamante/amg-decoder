# Epiphone Serial Rules

Date: 2026-06-26

Canonical data artifact: `data/brands/epiphone/rules.json`.

Fixture contract: `data/fixtures/epiphone_serial_rules.json`.

Source authority: official Gibson serial-number page, Epiphone section, source id `gibson_epiphone_serial_search`.

## Implemented Scope

The Epiphone module covers only Gibson-documented Epiphone guitar formats:

- Regular production pre-2008 `FYYMMRRRR` and `FYYMRRRR` patterns.
- Elite/Elitist `FYSSSS` pattern.
- All-numeric `YYMMRRRRRR` pattern around 2008-present.

## Exclusions

Factory-code name mappings are not encoded because the official Gibson page documents factory-code positions but not a complete public factory-name table. Dobro, banjo, and undocumented Epiphone exception formats remain excluded until separate source-backed flows exist.

## Product Boundary

The module may return production year, production month, factory code, rank or sequence, series hint, warnings, and source attribution. It must not return authentication, exact factory identity, valuation, ownership, legal status, or exact model identity.

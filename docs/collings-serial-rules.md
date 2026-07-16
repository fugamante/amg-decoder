# Collings Serial Rules

Canonical data artifact: `data/brands/collings/rules.json`.

Fixture artifact: `data/fixtures/collings_serial_rules.json`.

Source registry entry: `data/source-registry.json#collings_faq_serial_numbers`.

## Implemented Scope

AMG Decoder implements the official Collings FAQ electric serial structure only:

- general electric series/model designation
- two-digit production-start year
- category sequence

Collings acoustic serials stay records-assisted. The app can recognize a 3-5 digit numeric acoustic-style serial and direct the user to contact Collings, but it does not return an acoustic production year because the official FAQ does not publish a complete acoustic year chart.

## Product Boundary

Collings results must not claim authentication, exact model identity, exact ship date, ownership, legal status, or value. Electric year is production-start year, not necessarily ship year.

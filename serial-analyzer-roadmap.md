# AMG Decoder Roadmap

Date: 2026-05-27

## Product Direction

Expand the current Gibson-focused decoder into AMG Decoder: a broader American-made guitar serial analyzer with a deterministic brand-first interface.

The product should not start with a universal free-form decoder. Serial systems vary too much by brand, factory, period, and instrument line. The primary user path should be:

1. Choose a brand from a launchpad.
2. Enter serial details in a brand-specific analyzer.
3. Receive a structured result with confidence, matched rule, decoded fields, warnings, and source attribution.

An `Unknown / Not Sure` path can exist later, but it should be secondary and clearly labeled as lower-confidence pattern matching.

## Interface Roadmap

### Phase 1: Brand Launchpad

Create a first screen with brand sections/cards. Each brand entry should expose:

- Brand name.
- Electric, acoustic, bass, or mixed coverage.
- Confidence tier: `High`, `Mixed`, `Limited`, or `Research`.
- Typical return fields: year, date, factory, sequence, model/range, warnings.
- A short caution when the brand has known ambiguity.

Initial launchpad candidates:

| Brand | Coverage | Tier | Launchpad note |
| --- | --- | --- | --- |
| Gibson | electric/acoustic/custom | Mixed | Strong official modern rules, but historical and Custom Shop cases need scoped handling. |
| Taylor | acoustic/electric-acoustic | High | Modern rules can produce factory, start date, and daily sequence. |
| Martin | acoustic/ukulele | High | Serial maps cleanly to production year by range. |
| PRS | electric/acoustic/bass | High | Official prefix/range rules, with some decade ambiguity on early prefixes. |
| Gretsch | electric/acoustic | Mixed | Official dating guide exists, but older eras vary by label/location. |
| Fender | electric/acoustic/bass | Mixed | High demand, but overlapping serial ranges require warnings. |
| Ibanez | electric/acoustic/bass | Research | Many factory-specific systems; community references are useful but need source caution. |
| Epiphone | electric/acoustic | Research | Gibson source covers some newer behavior; factory-code detail needs careful sourcing. |
| Yamaha | acoustic/electric/classical | Research | Guitar-specific official lookup is not as clear as third-party summaries. |
| Takamine | acoustic/electric-acoustic | Research | Official Japan-built dating exists, but G-Series and other lines need exclusions. |

### Phase 2: Brand Analyzer Pages

Each brand gets its own intake screen. Required inputs should be minimal, with optional fields only when they materially improve confidence.

Common fields:

- Serial number.
- Instrument family, when relevant.
- Model, if visible.
- Serial location, if relevant.
- Country/factory marking, if visible.

Do not ask every question for every brand. For example, Taylor can start with only serial number, while Fender and Ibanez should invite country/factory markings because those materially affect interpretation.

### Phase 3: Result Contract

Every analyzer should return the same top-level structure:

| Field | Purpose |
| --- | --- |
| `brand` | Selected or inferred brand. |
| `input` | Normalized serial and optional user fields. |
| `confidence` | `high`, `medium`, `low`, or `unsupported`. |
| `matched_rule` | Stable rule identifier and human label. |
| `decoded` | Structured facts such as year, date, factory, range, sequence, model hints. |
| `warnings` | Ambiguity, exclusions, non-authentication language, missing context. |
| `sources` | Source names and URLs used to justify the rule. |

Important product constraint: the analyzer should date and identify likely production facts. It should not claim to authenticate instruments from serial number alone.

### Phase 4: Rule Engine

Represent each brand as a module with data-driven rules where possible.

Recommended module shape:

```text
brands/
  gibson/
    rules.json
    analyzer.*
    fixtures.*
  taylor/
    rules.json
    analyzer.*
    fixtures.*
  martin/
    ranges.json
    analyzer.*
    fixtures.*
```

Rule types needed:

- Regex parse rules.
- Numeric range lookup rules.
- Date validation rules.
- Factory/country code lookup rules.
- Ambiguity rules that intentionally return multiple candidates.
- Unsupported/exclusion rules.

### Phase 5: Validation

Each brand should have a test matrix with:

- Official documented examples.
- Boundary values.
- Known invalid values.
- Ambiguous examples.
- Unsupported examples.

The existing `test-matrix.md` should remain Gibson-specific or be renamed once brand test matrices are split.

## Implementation Order

### Milestone 1: Stabilize Gibson

- Fix existing parser defects noted in `interaction-summary.md`.
- Convert current Gibson examples into executable tests.
- Add result confidence and warning fields.
- Keep output contract stable before adding more brands.

### Milestone 2: Add Taylor

- Add 9-digit, 10-digit, 11-digit, older range, and `4-` serial support.
- Validate dates and production sequence.
- Include factory field for current 10-digit format.

Taylor is the best first expansion because its official documentation is deterministic and easy to test.

### Milestone 3: Add Martin

- Add serial-to-year range lookup.
- Return year, previous range boundary, next range boundary, and source.
- Mark unsupported/missing serial inputs clearly.

Martin validates the range-lookup side of the engine.

### Milestone 4: Add PRS

- Add year-prefix handling and set-neck serial ranges.
- Return ambiguity when single-digit prefixes can map to multiple decades.
- Add warnings for model-family assumptions.

PRS validates mixed prefix/range logic.

### Milestone 5: Add Gretsch And Fender

- Add Gretsch official dating eras with label/location warnings.
- Add Fender by country/series as separate subflows rather than one broad parser.
- Fender should emphasize likely ranges and supporting context, not exact dating.

### Milestone 6: Research Brands

- Add Ibanez, Epiphone, Yamaha, and Takamine only after source-specific rules are pinned.
- Mark community-derived rules differently from official-source rules.
- Prefer brand pages that ask for country/factory/model details before analyzing.

## UX Rules

- Brand-first, not guess-first.
- Confidence is always visible.
- Warnings are part of the result, not buried help text.
- Sources are visible from every result.
- Unsupported results should explain why and identify the missing context.
- Do not imply authenticity from serial number alone.

## Next Recommended Work

1. Decide whether to keep this as C++ CLI first or rebuild the user-facing analyzer as a small web/macOS app.
2. Stabilize the Gibson parser and tests.
3. Create a Taylor rule module as the first new brand.
4. Split brand research into source-backed markdown files before encoding each brand.

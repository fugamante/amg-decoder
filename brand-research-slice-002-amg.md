# Brand Research Slice 002: AMG Decoder

Date: 2026-05-28

Purpose: compare American-made guitar serialization coverage for Fender, PRS, Martin, Novo, and Collings, then identify the easiest user-facing analyzer flows for AMG Decoder.

## Executive Summary

| Brand | Automation Fit | Best User Flow | Primary Result |
| --- | --- | --- | --- |
| Martin | Excellent | One-field serial lookup plus optional model/origin check. | Production year by official serial range. |
| PRS | Strong | Ask line/family before parsing serial. | Approximate production year and family-specific sequence. |
| Collings | Split | Ask acoustic/electric first. | Electric start year and sequence; acoustic format check plus lookup guidance. |
| Fender | Scoped U.S. implemented | Ask origin, model/series, serial location, and serial for future non-U.S. flows. | U.S. likely year/range with strong ambiguity warnings. |
| Novo | Limited | Ask serial, model, series, and COA/dealer context. | Observed format and possible year, not official decoding. |

The easiest path for users is not the same for every brand. Martin can be nearly frictionless. PRS needs one extra question. Collings needs an acoustic/electric split. Fender needs guided context to avoid misleading answers. Novo should be framed as record-assisted research because no official public decoder was found.

## Recommended Brand Launchpad Ordering

1. Martin: easiest and most deterministic.
2. PRS: strong official documentation, moderate UI context needed.
3. Collings: excellent for electrics, limited official year decoding for acoustics.
4. Fender: first U.S.-made module implemented; continue with guided subflows to handle overlap.
5. Novo: useful boutique support, but lower-confidence unless backed by records.

## Brand Coverage Details

### Martin

Sources:

- `https://www.martinguitar.com/support-serial-number-lookup.html`
- `https://www.martinguitar.com/faqs.html`
- `https://www.martinguitar.com/series-standard.html`

Core rule:

- Martin publishes a year-to-last-serial table.
- Determine production year by finding the first official row where `serial <= last_serial`.
- The range for a year is `previous_year_last_serial + 1` through `current_year_last_serial`.
- The official page checked in this slice runs through 2025, ending at serial `3043480`.
- Serial range `900001-902908` is excluded because Martin identifies it as Sigma-Martin use in 1981-1982.

Best UI:

- Required: serial number.
- Optional but useful: instrument type, model designation from neck block, series/family, origin hint.

Analyzer should return:

- Estimated production year.
- Matched official range.
- Confidence: high when in range.
- Warning that serial dating gives year, not exact build date.
- Unsupported result for Sigma/Goya/import cases or serials above the current official table.

Recommended implementation tier: first AMG module after Gibson stabilization.

Readiness artifact status:

- Canonical data path: `data/brands/martin/ranges.json`.
- Source registry entry: `data/source-registry.json#martin_serial_lookup`.
- Fixture path: `data/fixtures/martin_standard_guitars_ukuleles.json`.
- Contract doc: `docs/martin-standard-ranges.md`.
- Validation command: `python3 scripts/validate_data.py`.

### PRS

Sources:

- `https://support.prsguitars.com/hc/en-us/articles/4408314427547-Year-Identification`
- `https://support.prsguitars.com/hc/en-us/articles/4408314531227-Model-History`
- `https://prsguitars.com/products/core`
- `https://prsguitars.com/products/bolt_on_electrics`
- `https://prsguitars.com/products/s2_electrics`

Core rule:

- PRS uses year-code prefixes, but one-digit prefixes are ambiguous across decades.
- Set-neck/Core and many Private Stock instruments use headstock serial ranges.
- CE, EG, S2, and Swamp Ash Special have family-specific conventions and ranges.
- S2 is USA-made in Stevensville, Maryland and has its own sequence table.
- CE 2016+ has official year prefixes but not full sequence ranges.

Best UI:

- Required: serial number and line/family.
- Strongly useful: serial location and model text.
- Ask whether it is Core/set-neck, Private Stock, CE/Bolt-On, S2, EG, Swamp Ash Special, SE, or unknown.

Analyzer should return:

- Candidate or exact approximate year.
- Family match.
- Prefix and sequence.
- Confidence: high for official range match, medium for prefix-only CE 2016+, low for family mismatch.
- Unsupported result for SE/import formats in the AMG module.

Implementation warning:

- Do not decode one-digit prefixes without family and sequence context.
- Flag official-table anomalies instead of silently correcting them.

Recommended implementation tier: second AMG module.

Readiness artifact status:

- Canonical data path: `data/brands/prs/rules.json`.
- Source registry entry: `data/source-registry.json#prs_year_identification`.
- Fixture path: `data/fixtures/prs_set_neck_rules.json`.
- Contract doc: `docs/prs-set-neck-ranges.md`.
- Implemented scope: set-neck and S2. CE, SE, EG, Swamp Ash, bass, acoustic, amplifier, and cabinet flows remain separate future work.
- Validation command: `npm test`.

### Collings

Sources:

- `https://collingsguitars.com/support/faq/`
- `https://store.collingsguitars.com/pages/about-us`
- `https://collingsguitars.com/support/owner-registration/`
- `https://bluebookofguitarvalues.com/guitar-values/acoustic-guitars/manufacturer/collings-guitars/category/collings-guitars-label-identification-serialization/models`

Core rule:

- Collings electric serials begin with a series/model designation, then two year digits, then a category sequence.
- Official electric examples include `290181443` and `I35LC232197`.
- Electric year is production-start year, not necessarily ship year.
- Post-1991 acoustic flat-tops use 3-5 digit numeric serials on the neck block, but Collings does not publish a complete official year-end chart.
- Collings says exact ship-date information requires contacting Collings with serial number.

Best UI:

- First ask: acoustic or electric.
- Electric required fields: serial number and model/series.
- Acoustic required fields: serial number and serial location.
- Optional: label text, purchase/listing year, photos, owner-registration context.

Analyzer should return:

- For electrics: model prefix, production-start year, category sequence, warning that ship year may differ.
- For acoustics: valid Collings acoustic numeric format and official lookup guidance.
- Optional secondary estimate only if the source is clearly labeled non-official.

Recommended implementation tier: third AMG module, after PRS.

### Fender

Sources:

- `https://support.fender.com/en-us/knowledgebase/article/KA-01873`
- `https://support.fender.com/hc/en-us/articles/42585347213339-Where-can-I-find-my-serial-number`
- `https://support.fender.com/hc/en-us/articles/42521687782811-How-can-I-find-out-how-old-my-instrument-is-if-it-uses-an-odd-or-non-standard-serial-numbering-scheme`
- `https://serialnumberlookup.fender.com/lookup/`

Core rule:

- Fender has many U.S.-made serial eras and prefixes.
- Early numeric, `L`, CBS-era, `S`, `E`, `V`, `N`, `Z`, `DZ`, `10`, and `USYY` schemes all need separate handling.
- Fender explicitly warns that serial ranges overlap and that modular production makes serial-only dating approximate.
- `USYY + 6 digits` is the strongest modern U.S. path, beginning around March 2010.
- `V` serials identify American Vintage-style candidates, but do not decode to a specific year without neck-date context.

Best UI:

- Required: serial number.
- Strongly recommended before analysis: claimed origin, model/series, serial location, made-in label.
- Optional: neck date, Fender lookup result, whether it is Custom Shop/FSR/signature/export.

Analyzer should return:

- Matched scheme.
- Likely year or year range.
- Origin confidence.
- Warnings for overlap, model exceptions, and serial-location issues.
- Fender lookup suggestion where appropriate.

Implementation warning:

- Fender should remain guided by subflow, not a universal regex. The first U.S.-made subflow is implemented.
- Do not classify a missing Fender lookup result as counterfeit evidence.
- Do not force exact years for overlapping ranges.

Recommended implementation tier: fourth AMG module, after easier deterministic modules are stable.

### Suhr

Sources:

- `https://www.suhr.com/support/warranty-registration/`
- `https://www.suhr.com/contact/`
- `https://www.suhr.com/custom-gallery/`

Core rule:

- No official public Suhr serial decoder was found.
- Official Suhr registration/contact surfaces can use serial numbers as records context, but they do not publish a reusable serial-to-year or serial-to-model rule.
- Official gallery/product examples may show individual instruments and serial numbers, but individual records are not a general decoding rule.

Best UI:

- Keep Suhr read-only as research guidance until manufacturer-backed serial structure is reviewed.
- If enabled later, use a records-assisted flow that asks for serial, model, purchase/listing context, and photos/source evidence.

Analyzer should return:

- Nothing production-facing yet. Do not infer year, model, warranty eligibility, authenticity, or value from Suhr serial alone.

Implementation warning:

- Dealer or gallery examples are not enough to build a production decoder. They can only seed a future reviewed evidence table if each row has source attribution and the UI labels it as records-assisted research.

### Novo

Sources:

- `https://www.novoguitars.com/pages/warranty`
- `https://www.novoguitars.com/products/serus-t`
- `https://www.novoguitars.com/collections/nucleus`
- `https://www.novoguitars.com/collections/signature`
- `https://www.novoguitars.com/pages/dealers`

Dealer/listing evidence:

- `https://eddiesguitars.com/product-category/electric/electric-guitar-brands/novo`
- `https://www.sweetwater.com/used/listings/372062-used-novo-serus-s-2016-2017-dakota-red`
- `https://watchtower-guitars.myshopify.com/products/2019-novo-guitars-serus-s-uffington-green-fralins`
- `https://watchtower-guitars.myshopify.com/products/2019-novo-serus-tcs-round-up-orange-lollartrons`
- `https://www.toneshopguitars.com/products/used-novo-solus-f1-swamp-ash-w-mono-bag-tsu24256`
- `https://www.guitarstobeplayed.com/novo-signature-miris-j-h2o-glow-df0101.html`

Core rule:

- No official public Novo serial decoder was found.
- Novo warranty language confirms serial numbers matter, especially removed or altered serials.
- Official current product pages identify guitars as built in Nashville, Tennessee.
- Dealer examples suggest many standard serials are five digits, sometimes formatted as two digits, space, three digits.
- Dealer evidence suggests the first two digits often align to production year, but this must be treated as medium confidence and non-official.
- Signature instruments may use alphanumeric identifiers such as `DF0101`; limited-edition text like `6 of 8` should not be treated as a serial.

Best UI:

- Required: serial number and model/family.
- Strongly recommended: series type, claimed year, country/shop marking, dealer/source.
- For Signature or limited instruments: ask whether a COA is present and capture edition text separately from serial.

Analyzer should return:

- Observed Novo numeric format.
- Possible year from numeric prefix only when plausible.
- Sequence suffix.
- Confidence: medium for dealer-backed numeric inference, low for special formats.
- Official-records-needed warning.

Implementation warning:

- Novo should not be presented as a definitive decoder.
- It should remain read-only until a product decision explicitly accepts a low-confidence, dealer-evidence-only research helper. Any such helper must label dealer evidence separately from official sources and avoid year/model conclusions in the primary result.

Recommended implementation tier: fifth AMG module.

## Easiest User-Facing Patterns

### Pattern A: One-Field Range Lookup

Use for Martin.

Flow:

1. Select Martin.
2. Enter serial.
3. Optional: add model/origin.
4. Return production year and official range.

This is the cleanest UX and should define the baseline analyzer experience.

### Pattern B: Family-Guided Decode

Use for PRS and Collings electrics.

Flow:

1. Select brand.
2. Choose line/family.
3. Enter serial.
4. Return year, prefix, sequence, confidence, and warnings.

This avoids ambiguous prefix interpretation while keeping the form short.

### Pattern C: Context-Guided Estimate

Use for Fender.

Flow:

1. Select Fender.
2. Enter serial.
3. Add origin, serial location, model/series, and made-in label.
4. Return likely year/range and explain what remains uncertain.

This is the right UX for high-demand but overlapping serial systems.

### Pattern D: Records-Assisted Research

Use for Novo and Collings acoustics.

Flow:

1. Select brand.
2. Choose instrument type.
3. Enter serial and model.
4. Return format validation, likely convention, confidence, and official/dealer-record next steps.

This keeps the product honest when a true public decoder does not exist.

## Implementation Recommendation

Build AMG Decoder in this order:

1. Martin: fastest high-confidence win.
2. PRS: high-value, official, but needs family selection.
3. Collings electric: clean official rule once acoustic/electric split exists.
4. Fender modern and historical U.S.: implemented for `USYY`, `10`, `Z`, `DZ`, V-prefix context guidance, S/E/N, numeric, and L-prefix scoped rules.
5. Collings acoustic: format validation plus lookup guidance.
6. Novo: observed-format helper with clear non-official confidence.
7. Fender vintage/odd cases: add incrementally with strong warnings and fixture coverage.

## Product Naming

Use `AMG Decoder` as the product name and `amg-decoder` as the public repository slug.

Avoid expanding AMG in every UI surface. The subtitle can clarify scope:

`AMG Decoder: American-made guitar serial research and dating`

## Open Questions

- Which Gibson exception family should be next after the official guitar-scope and Epiphone modules: artist signature, Dobro, banjo, or undocumented exceptions?
- Should Taylor be included despite not being in this American-made research batch? Taylor is American-made for much of the relevant product line and has excellent official serial documentation.
- Should Fender Custom Shop be a separate module from Fender USA production?
- Should Collings acoustic use secondary range estimates at all, or only official lookup guidance?
- Should Novo provide possible-year estimates by default, or hide them behind an “observed dealer evidence” confidence state?

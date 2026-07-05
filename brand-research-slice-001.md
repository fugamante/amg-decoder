# Brand Research Slice 001

Date: 2026-05-27

Purpose: identify which guitar brands are good candidates for the first expansion of the Gibson decoder into AMG Decoder, a brand-first serial analyzer.

Research rule: prefer official manufacturer support pages. Use community or third-party references only as lower-confidence leads, not as production rules without follow-up verification.

## Priority Summary

| Priority | Brand | Confidence | Why |
| --- | --- | --- | --- |
| 1 | Taylor | High | Official page documents current and historical serial formats with examples. |
| 2 | Martin | High | Official serial lookup maps serial ranges to production years. |
| 3 | PRS | High | Official support page provides prefix and serial range tables. |
| 4 | Gretsch | Mixed | Official product dating page exists, but older eras need label/location context. |
| 5 | Fender | Scoped | Official U.S.-made, Mexican-made, Indonesian-made, and Japan-context Fender support rules are implemented; remaining regional and special-family flows stay separate. |
| 6 | Gibson | Scoped | Official Gibson guitar serial rules are implemented; signature, Dobro, banjo, and undocumented exceptions remain separate. Epiphone is tracked as its own scoped analyzer. |
| 7 | Takamine | Research | Official German page documents two codes for Japan-built instruments, but exclusions need handling. |
| 8 | Epiphone | Scoped | Gibson official page covers scoped Epiphone guitar formats; factory-name mapping remains excluded. |
| 9 | Ibanez | Research | Strong community reference, but no single unified official format. |
| 10 | Yamaha | Research | Guitar-specific official material is hard to pin down; third-party summaries describe many systems. |

## Brand Notes

### Taylor

Source: `https://www.taylorguitars.com/support/general/decoding-taylor-guitars-serial`

Official Taylor documentation describes:

- Current 10-digit format starting in November 2009.
- 9-digit format from 1993 through 1999.
- 11-digit format from January 2000 through October 2009.
- Older serial ranges before 1993.
- `4-` serial format for early 410 models.

Analyzer fit: excellent.

Likely output fields:

- Production/start date.
- Factory for current 10-digit format.
- Series code for 9- and 11-digit formats.
- Daily sequence.
- Older range year.

Implementation note: Taylor should be the first non-Gibson brand.

Readiness artifact status:

- Canonical data path: `data/brands/taylor/rules.json`.
- Source registry entry: `data/source-registry.json#taylor_serial_decode`.
- Fixture path: `data/fixtures/taylor_serial_rules.json`.
- Contract doc: `docs/taylor-serial-rules.md`.
- Validation command: `npm test`.

### Martin

Source: `https://www.martinguitar.com/support-serial-number-lookup.html`

Official Martin documentation provides a serial-to-year quick reference table for guitars and ukuleles.

Analyzer fit: excellent.

Likely output fields:

- Production year.
- Matched numeric range.
- Previous and next range boundaries.

Implementation note: Martin should be a pure range lookup. Do not overstate exact production date.

### PRS

Source: `https://support.prsguitars.com/hc/en-us/articles/4408314427547-Year-Identification`

Official PRS support documents:

- Year-code prefixes.
- Set-neck serial number ranges.
- Serial locations.

Analyzer fit: strong.

Likely output fields:

- Production year candidate.
- Prefix.
- Sequential serial/range.
- Model-family assumption or location note.

Implementation note: early one-digit prefixes can map to multiple years. Return ambiguity instead of forcing one year unless range context resolves it.

### Gretsch

Source: `https://gretschguitars.com/support/product-dating`

Official Gretsch product dating documentation describes multiple eras, including:

- Sequential serials for 1939-1965.
- Changes in serial placement and label styles.
- Later label and date-coded systems.

Analyzer fit: good, with context requirements.

Likely output fields:

- Date range or production date depending on era.
- Serial location/label era.
- Warnings when physical context is needed.

Implementation note: Gretsch brand page should ask for serial location or label type before attempting vintage interpretation.

### Fender

Sources:

- `https://support.fender.com/en-us/knowledgebase/article/KA-01873`
- `https://support.fender.com/hc/en-us/articles/42585347213339-Where-can-I-find-my-serial-number`
- `https://support.fender.com/hc/en-us/articles/42521687782811-How-can-I-find-out-how-old-my-instrument-is-if-it-uses-an-odd-or-non-standard-serial-numbering-scheme`

Official Fender support documents serial locations and product dating, but warns that modular production and overlapping serial ranges make serial-only dating imprecise.

Analyzer fit: high demand; first U.S.-made instrument scope is implemented with medium/high confidence depending on rule precision.

Likely output fields:

- Likely year or year range.
- Country/series if encoded or supplied.
- Serial location.
- Explicit overlap warning.

Implementation note: Fender should not be a single broad parser. The first U.S.-made instrument subflow is implemented; add `Mexico`, `Japan`, `Korea`, `Squier`, `Acoustic`, Custom Shop, and special-run flows only when source coverage is good enough.

### Gibson

Source: `https://www.gibson.com/en-eu/pages/serial-number-search`

Official Gibson documentation covers modern Gibson USA, Gibson Acoustic, Gibson Memphis, Gibson Custom, and some Epiphone serial behavior.

Current local project source: local polished Gibson serial-number rules document.

Analyzer fit: first official Gibson guitar scope is implemented; remaining exceptions need separate source-backed flows.

Known local defects from `interaction-summary.md`:

- Some documented valid examples are rejected.
- `A-38005` can crash.
- Some carved-top examples are misparsed.

Implementation note: do not use the old C++ prototype as a production authority. Use the official Gibson data artifact and fixtures as the checked contract.

### Takamine

Source: `https://www.takamineguitars.de/about/ueber-uns/baujahr-bestimmen`

Official Takamine Germany page says Takamine has used two dating codes for instruments built in the main Japan factory.

Analyzer fit: possible, with exclusions.

Likely output fields:

- Year/month or year/month/day depending on code.
- Japan-built scope warning.
- Unsupported line warning.

Implementation note: do not claim broad Takamine coverage until G-Series and non-Japan cases are explicitly handled or excluded.

### Epiphone

Sources:

- `https://www.gibson.com/en-eu/pages/serial-number-search`
- `https://epiphonewiki.org/index/Epiphone_Serial_Number_Decoding.php`

Gibson official documentation mentions Epiphone behavior, including all-numeric serials around 2008. Detailed factory-code mappings are mostly from community references.

Analyzer fit: useful, with the first Gibson-documented guitar formats implemented.

Likely output fields:

- Year/month where supported.
- Factory code where supported.
- Ranking/sequence.
- Source confidence warning.

Implementation note: keep official Gibson-sourced Epiphone rules separate from community-sourced factory-code name mappings.

### Ibanez

Source: `https://ibanez.fandom.com/wiki/Ibanez_serial_numbers`

The Ibanez Wiki is detailed and current, but community-maintained. It emphasizes that there is no single unified Ibanez serial format because production spans many factories and regions.

Analyzer fit: high user value, high complexity.

Likely output fields:

- Country/factory.
- Model year or production year.
- Month estimate where supported.
- Sequence.
- Ambiguity warning.

Implementation note: require country/factory marking when available. Do not implement as a high-confidence module until official or catalog-backed rules are collected.

### Yamaha

Sources:

- `https://www.yamaha.com/YEC/Pages/Search/YECSerialNumberLookup.aspx`
- `https://www.yamaha.com/warranties/downloads/guitars.pdf`

Yamaha official pages found in this slice confirm product serial lookup and warranty context, but not a clear guitar-specific serial decoding table. Third-party guitar pages describe many Yamaha acoustic/classical systems, but need verification.

Analyzer fit: research only for now.

Implementation note: do not add Yamaha until guitar-specific source material is pinned by model family, factory, and era.

## Source Reliability Tiers

| Tier | Meaning | Use in analyzer |
| --- | --- | --- |
| Official | Manufacturer support/documentation page. | Can drive production rules when unambiguous. |
| Manufacturer-adjacent | Official regional page, warranty page, catalog, or archived manufacturer document. | Can drive scoped rules with clear source notes. |
| Community | Wiki, forum, collector page, third-party decoder. | Use as research lead or optional low-confidence rule only. |
| Unverified | Search result, anecdote, undocumented claim. | Do not encode as production rule. |

## Recommended Slice 002

Research Taylor, Martin, and PRS deeply enough to create executable fixture tables:

- Pull official examples.
- Define valid and invalid boundaries.
- Record exact rule IDs.
- Identify fields required in the UI.
- Produce brand-specific test matrices.

This creates the first non-Gibson implementation path without taking on Fender/Ibanez ambiguity too early.

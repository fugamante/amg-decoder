# Martin Standard Guitar and Ukulele Range Contract

Date: 2026-06-23

Source authority: C. F. Martin & Co. Serial/Date Lookup.

Data artifact: `data/brands/martin/ranges.json`.

Fixture artifact: `data/fixtures/martin_standard_guitars_ukuleles.json`.

Analyzer module: `web/analyzer.js`.

## Scope

This contract covers the official Martin `Guitars & Ukuleles` year-to-last-serial table from 1898 through 2025.

The lookup rule is:

1. Normalize input as digits only.
2. Reject empty or non-digit serials.
3. Reject explicit quarantines before range lookup.
4. Return the first row where `serial <= last_serial`.
5. Compute `range_start` as the previous row's `last_serial + 1`, or `1` for 1898.

## Quarantine

Serials `900001` through `902908` remain unsupported because Martin identifies them as Sigma-Martin serials from 1981-1982, not standard 2002 guitar/ukulele serials.

Do not remove or narrow this quarantine unless row-level authority evidence is added and fixtures are updated.

## Out of Scope

The official Martin page also publishes separate tables for Little Martin (LX), Backpacker, mandolins, solid wood ukuleles, and HPL ukuleles. Those are intentionally excluded until the analyzer has an explicit instrument-family selector for each separate table.

## Output Boundary

The module may return production year, matched serial range, confidence, warnings, and source attribution. It must not return exact build date, model identity, authenticity, value, or recommendation.

## Executable Checks

Run both fixture and data validation with:

```sh
npm test
```

The JavaScript fixture test verifies the shared analyzer module used by the static web UI. The static UI test checks core accessibility and product-boundary hooks. The Python data validator checks source registry, schema, range monotonicity, quarantine boundaries, and fixture coverage.

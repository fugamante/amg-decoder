#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/Sources/AnalyzerCore/Resources/Data"

mkdir -p "$DEST/fixtures"

cp "$ROOT/data/source-registry.json" "$DEST/source-registry.json"
cp "$ROOT/data/active-brands.json" "$DEST/active-brands.json"
cp "$ROOT/data/brands/martin/ranges.json" "$DEST/martin-ranges.json"
cp "$ROOT/data/brands/taylor/rules.json" "$DEST/taylor-rules.json"
cp "$ROOT/data/brands/prs/rules.json" "$DEST/prs-rules.json"
cp "$ROOT/data/brands/gibson/rules.json" "$DEST/gibson-rules.json"
cp "$ROOT/data/brands/fender/rules.json" "$DEST/fender-rules.json"
cp "$ROOT/data/brands/epiphone/rules.json" "$DEST/epiphone-rules.json"
cp "$ROOT/data/brands/collings/rules.json" "$DEST/collings-rules.json"
cp "$ROOT/data/fixtures/martin_standard_guitars_ukuleles.json" "$DEST/fixtures/martin_standard_guitars_ukuleles.json"
cp "$ROOT/data/fixtures/taylor_serial_rules.json" "$DEST/fixtures/taylor_serial_rules.json"
cp "$ROOT/data/fixtures/prs_set_neck_rules.json" "$DEST/fixtures/prs_set_neck_rules.json"
cp "$ROOT/data/fixtures/gibson_serial_rules.json" "$DEST/fixtures/gibson_serial_rules.json"
cp "$ROOT/data/fixtures/fender_us_serial_rules.json" "$DEST/fixtures/fender_us_serial_rules.json"
cp "$ROOT/data/fixtures/epiphone_serial_rules.json" "$DEST/fixtures/epiphone_serial_rules.json"
cp "$ROOT/data/fixtures/collings_serial_rules.json" "$DEST/fixtures/collings_serial_rules.json"

printf 'Synced AnalyzerCore resources from canonical data artifacts.\n'

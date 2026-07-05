#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export SIMULATOR_ID="${SIMULATOR_ID:-E642B86F-F915-4992-9D3F-17332147755B}"
export SIMULATOR_DESTINATION="${SIMULATOR_DESTINATION:-platform=iOS Simulator,id=${SIMULATOR_ID}}"
export DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-/tmp/amg-decoder-simulator-iphone-ui/DerivedData}"
export RESULT_BUNDLE_PATH="${RESULT_BUNDLE_PATH:-$ROOT/dist/simulator-iphone-ui/AMGDecoderCompactIPhoneUITests.xcresult}"
export UI_TEST_TIMEOUT_SECONDS="${UI_TEST_TIMEOUT_SECONDS:-120}"
export UI_TEST_MODE="compact_iphone"
export UI_TEST_LABEL="compact iPhone UI assertions"
export ONLY_TESTING="AMGDecoderUITests/AMGDecoderUITests/testCompactIPhoneNavigationAnalyzerFlow"

printf '%s\n' "Running compact iPhone UI assertions on simulator ${SIMULATOR_ID}" >&2
"$ROOT/script/check_simulator_ui.sh"

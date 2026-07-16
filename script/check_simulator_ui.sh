#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"
IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"
SIMULATOR_ID="${SIMULATOR_ID:-F0D1D633-611F-4D8D-9571-E1574E065EE0}"
SIMULATOR_DESTINATION="${SIMULATOR_DESTINATION:-platform=iOS Simulator,id=${SIMULATOR_ID}}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-/tmp/amg-decoder-simulator-ui/DerivedData}"
RESULT_BUNDLE_PATH="${RESULT_BUNDLE_PATH:-$PWD/dist/simulator-ui/AMGDecoderUITests.xcresult}"
UI_TEST_TIMEOUT_SECONDS="${UI_TEST_TIMEOUT_SECONDS:-120}"
ONLY_TESTING="${ONLY_TESTING:-}"
UI_TEST_MODE="${UI_TEST_MODE:-}"
UI_TEST_LABEL="${UI_TEST_LABEL:-iPad UI assertions}"
APP_BUNDLE_ID="${APP_BUNDLE_ID:-app.amgdecoder.local.ios}"
TEST_RUNNER_BUNDLE_ID="${TEST_RUNNER_BUNDLE_ID:-app.amgdecoder.local.uitests.xctrunner}"

log() {
  printf '%s\n' "$*" >&2
}

mkdir -p "$(dirname "$RESULT_BUNDLE_PATH")"
rm -rf "$DERIVED_DATA_PATH" "$RESULT_BUNDLE_PATH"
xcrun simctl boot "$SIMULATOR_ID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$SIMULATOR_ID" -b >/dev/null 2>&1 || true
xcrun simctl terminate "$SIMULATOR_ID" "$APP_BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl terminate "$SIMULATOR_ID" "$TEST_RUNNER_BUNDLE_ID" >/dev/null 2>&1 || true
sleep 2

log "Running ${IOS_SCHEME} ${UI_TEST_LABEL} on simulator ${SIMULATOR_ID}"
only_testing_args=()
if [[ -n "$ONLY_TESTING" ]]; then
  only_testing_args+=("-only-testing:$ONLY_TESTING")
fi

export AMG_DECODER_UI_TEST_MODE="$UI_TEST_MODE"
set +e
xcodebuild \
  -project "$PROJECT" \
  -scheme "$IOS_SCHEME" \
  -destination "$SIMULATOR_DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -resultBundlePath "$RESULT_BUNDLE_PATH" \
  "${only_testing_args[@]}" \
  test &
xcodebuild_pid=$!
timeout_marker="$(mktemp "${TMPDIR:-/tmp}/amg-decoder-ui-timeout.XXXXXX")"
rm -f "$timeout_marker"

(
  sleep "$UI_TEST_TIMEOUT_SECONDS"
  if kill -0 "$xcodebuild_pid" 2>/dev/null; then
    touch "$timeout_marker"
    log "Timed out after ${UI_TEST_TIMEOUT_SECONDS}s waiting for simulator UI assertions."
    kill -INT "$xcodebuild_pid" 2>/dev/null || true
    for _ in 1 2 3 4 5; do
      kill -0 "$xcodebuild_pid" 2>/dev/null || break
      sleep 1
    done
    if kill -0 "$xcodebuild_pid" 2>/dev/null; then
      kill -TERM "$xcodebuild_pid" 2>/dev/null || true
    fi
    for _ in 1 2 3; do
      kill -0 "$xcodebuild_pid" 2>/dev/null || break
      sleep 1
    done
    if kill -0 "$xcodebuild_pid" 2>/dev/null; then
      kill -KILL "$xcodebuild_pid" 2>/dev/null || true
    fi
  fi
) &
watchdog_pid=$!

wait "$xcodebuild_pid"
status=$?
kill "$watchdog_pid" 2>/dev/null || true
wait "$watchdog_pid" 2>/dev/null || true
set -e

if [ -f "$timeout_marker" ]; then
  rm -f "$timeout_marker"
  exit 124
fi
rm -f "$timeout_marker"

if [ "$status" -ne 0 ]; then
  exit "$status"
fi

test -d "$RESULT_BUNDLE_PATH"
log "Simulator UI result bundle: $RESULT_BUNDLE_PATH"

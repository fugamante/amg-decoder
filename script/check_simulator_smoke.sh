#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"
IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"
SIMULATOR_ID="${SIMULATOR_ID:-E642B86F-F915-4992-9D3F-17332147755B}"
SIMULATOR_DESTINATION="${SIMULATOR_DESTINATION:-platform=iOS Simulator,id=${SIMULATOR_ID}}"
BUNDLE_ID="${BUNDLE_ID:-app.amgdecoder.local.ios}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-/tmp/amg-decoder-simulator-smoke/DerivedData}"
SCREENSHOT_PATH="${SCREENSHOT_PATH:-$PWD/dist/simulator-smoke/amg-decoder-iphone-smoke.png}"
SMOKE_SETTLE_SECONDS="${SMOKE_SETTLE_SECONDS:-4}"

booted_by_script=0

log() {
  printf '%s\n' "$*" >&2
}

cleanup() {
  xcrun simctl terminate "$SIMULATOR_ID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  if [[ "$booted_by_script" == "1" ]]; then
    xcrun simctl shutdown "$SIMULATOR_ID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

mkdir -p "$(dirname "$SCREENSHOT_PATH")"
rm -f "$SCREENSHOT_PATH"
rm -rf "$DERIVED_DATA_PATH"

log "Building ${IOS_SCHEME} for simulator ${SIMULATOR_ID}"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$IOS_SCHEME" \
  -destination "$SIMULATOR_DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build

app_path="$(find "$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator" -maxdepth 1 -type d -name 'AMG Decoder.app' -print -quit)"
if [[ -z "$app_path" ]]; then
  log "Unable to find built AMG Decoder.app in $DERIVED_DATA_PATH"
  exit 1
fi

actual_bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$app_path/Info.plist")"
if [[ "$actual_bundle_id" != "$BUNDLE_ID" ]]; then
  log "Expected bundle id $BUNDLE_ID but built $actual_bundle_id"
  exit 1
fi

device_line="$(xcrun simctl list devices | grep "$SIMULATOR_ID" || true)"
if [[ "$device_line" != *"(Booted)"* ]]; then
  booted_by_script=1
  xcrun simctl boot "$SIMULATOR_ID" >/dev/null 2>&1 || true
fi
xcrun simctl bootstatus "$SIMULATOR_ID" -b

log "Installing $app_path"
xcrun simctl install "$SIMULATOR_ID" "$app_path"

log "Launching $BUNDLE_ID"
xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"
sleep "$SMOKE_SETTLE_SECONDS"

log "Capturing simulator screenshot"
xcrun simctl io "$SIMULATOR_ID" screenshot "$SCREENSHOT_PATH"
test -s "$SCREENSHOT_PATH"

log "Simulator smoke screenshot: $SCREENSHOT_PATH"

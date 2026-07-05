#!/usr/bin/env bash
set -euo pipefail

PROJECT="${PROJECT:-AMGDecoder.xcodeproj}"
IOS_SCHEME="${IOS_SCHEME:-AMGDecoderApp-iOS}"
MACOS_SCHEME="${MACOS_SCHEME:-AMGDecoderApp-macOS}"
MAC_DESTINATION="${MAC_DESTINATION:-platform=macOS}"
IPHONE_DESTINATION="${IPHONE_DESTINATION:-platform=iOS Simulator,name=iPhone 17,OS=26.5}"
IPAD_DESTINATION="${IPAD_DESTINATION:-platform=iOS Simulator,name=iPad (A16),OS=26.5}"

log() {
  printf '%s\n' "$*" >&2
}

log "Checking Xcode toolchain"
xcodebuild -version >&2
xcode-select -p >&2

log "Inspecting committed Xcode project schemes"
xcodebuild -list -project "$PROJECT" >&2

log "Inspecting destinations for ${IOS_SCHEME}"
xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -showdestinations >&2

log "Inspecting destinations for ${MACOS_SCHEME}"
xcodebuild -project "$PROJECT" -scheme "$MACOS_SCHEME" -showdestinations >&2

log "Building ${MACOS_SCHEME} for macOS"
xcodebuild -project "$PROJECT" -scheme "$MACOS_SCHEME" -destination "$MAC_DESTINATION" build

log "Building ${IOS_SCHEME} for iPhone simulator"
xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -destination "$IPHONE_DESTINATION" build

log "Building ${IOS_SCHEME} for iPad simulator"
xcodebuild -project "$PROJECT" -scheme "$IOS_SCHEME" -destination "$IPAD_DESTINATION" build

log "Xcode readiness check passed"

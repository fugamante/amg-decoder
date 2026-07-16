#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROCESS_NAME="${PROCESS_NAME:-AMGDecoderApp}"

cleanup() {
  pkill -x "$PROCESS_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT

printf '%s\n' "Running macOS UI assertions for AMG Decoder" >&2
"$ROOT/script/build_and_run.sh" --verify >/dev/null

osascript <<'APPLESCRIPT'
on require(condition, message)
  if condition is false then error message number 1
end require

on staticTextDump(targetContainer)
  tell application "System Events"
    set output to ""
    repeat with textItem in static texts of targetContainer
      try
        set output to output & (name of textItem as text) & linefeed
      end try
    end repeat
    repeat with childItem in UI elements of targetContainer
      try
        set output to output & my staticTextDump(childItem)
      end try
    end repeat
    return output
  end tell
end staticTextDump

on containsText(haystack, needle)
  return haystack contains needle
end containsText

on linkCount(targetContainer)
  tell application "System Events"
    set total to 0
    repeat with itemRef in UI elements of targetContainer
      try
        if (role of itemRef as text) is "AXLink" then set total to total + 1
      end try
      try
        set total to total + my linkCount(itemRef)
      end try
    end repeat
    return total
  end tell
end linkCount

on accessibilityIdentifier(itemRef)
  tell application "System Events"
    try
      return value of attribute "AXIdentifier" of itemRef as text
    on error
      return ""
    end try
  end tell
end accessibilityIdentifier

on textFieldWithIdentifier(targetContainer, identifier)
  tell application "System Events"
    repeat with fieldItem in text fields of targetContainer
      try
        if my accessibilityIdentifier(fieldItem) is identifier then return fieldItem
      end try
    end repeat
    repeat with childItem in UI elements of targetContainer
      try
        set foundItem to my textFieldWithIdentifier(childItem, identifier)
        if foundItem is not missing value then return foundItem
      end try
    end repeat
    return missing value
  end tell
end textFieldWithIdentifier

on detailScrollFor(appWindow)
  tell application "System Events"
    set rootGroup to UI element 1 of appWindow
    set splitGroup to UI element 1 of rootGroup
    set detailGroup to UI element 3 of splitGroup
    return UI element 1 of detailGroup
  end tell
end detailScrollFor

on sidebarGroupFor(appWindow)
  tell application "System Events"
    set rootGroup to UI element 1 of appWindow
    set splitGroup to UI element 1 of rootGroup
    return UI element 1 of splitGroup
  end tell
end sidebarGroupFor

on assertCoreSurface(appWindow, label)
  tell application "System Events"
    set sidebarGroup to my sidebarGroupFor(appWindow)
    set detailScroll to my detailScrollFor(appWindow)
    my require((description of UI element 1 of UI element 1 of sidebarGroup as text) is "Sidebar", label & ": sidebar outline was not visible")

    set visibleText to my staticTextDump(detailScroll)
    my require(my containsText(visibleText, "Martin serial analyzer"), label & ": Martin analyzer header was not visible")
    my require(my containsText(visibleText, "Serial number"), label & ": serial input label was not visible")
    my require(my containsText(visibleText, "Serial results do not establish authenticity, model identity, or value."), label & ": product-boundary footer was not visible")
  end tell
end assertCoreSurface

on waitForText(targetContainer, needle, message)
  repeat 20 times
    if my containsText(my staticTextDump(targetContainer), needle) then return
    delay 0.25
  end repeat
  error message number 1
end waitForText

on clickButtonWithIdentifier(targetContainer, identifier)
  tell application "System Events"
    repeat with buttonItem in buttons of targetContainer
      try
        if my accessibilityIdentifier(buttonItem) is identifier then
          click buttonItem
          return true
        end if
      end try
    end repeat
    repeat with childItem in UI elements of targetContainer
      try
        if my clickButtonWithIdentifier(childItem, identifier) then return true
      end try
    end repeat
    return false
  end tell
end clickButtonWithIdentifier

on assertMartinResult(appWindow, label)
  tell application "System Events"
    set detailScroll to my detailScrollFor(appWindow)
    set resultText to my staticTextDump(detailScroll)
    my require(my containsText(resultText, "HIGH confidence"), label & ": Martin confidence result was not visible")
    my require(my containsText(resultText, "Production year 2024"), label & ": Martin production-year result was not visible")
    my require(my containsText(resultText, "martin.standard_guitars_ukuleles.1898_2025"), label & ": matched Martin rule was not visible")
    my require(my containsText(resultText, "Source"), label & ": source label was not visible")
    my require((my linkCount(detailScroll)) > 0, label & ": source link was not visible")
    my require(my containsText(resultText, "Serial lookup returns a production year by official range, not an exact build date. Serial lookup does not authenticate an instrument or identify its model."), label & ": descriptive-only warning was not visible")
    my require(my containsText(resultText, "Serial results do not establish authenticity, model identity, or value."), label & ": product-boundary footer was not preserved")
  end tell
end assertMartinResult

tell application "System Events"
  set processName to "AMGDecoderApp"
  repeat 20 times
    if exists process processName then exit repeat
    delay 0.25
  end repeat
  my require(exists process processName, "AMG Decoder process did not launch")

  tell process processName
    set frontmost to true
    repeat 20 times
      if (count of windows) > 0 then exit repeat
      delay 0.25
    end repeat
    my require((count of windows) > 0, "AMG Decoder window did not appear")

    set appWindow to window 1
    my require((name of appWindow as text) is "Martin", "Expected the default Martin analyzer window")

    set size of appWindow to {900, 640}
    delay 0.5
    my assertCoreSurface(appWindow, "minimum window")

    set detailScroll to my detailScrollFor(appWindow)
    set initialText to my staticTextDump(detailScroll)
    my require(my containsText(initialText, "Martin serial analyzer"), "Martin analyzer header was not visible")
    my require(my containsText(initialText, "Serial number"), "Serial input label was not visible")
    my require(my containsText(initialText, "Ready for a Martin serial"), "Empty Martin result state was not visible")
    my require(my containsText(initialText, "Serial results do not establish authenticity, model identity, or value."), "Product-boundary footer was not visible")

    set serialField to my textFieldWithIdentifier(detailScroll, "serial-input")
    my require(serialField is not missing value, "Serial field was not keyboard reachable")
    set focused of serialField to true
    click serialField
    delay 0.2
    keystroke "2935987"
    keystroke return using command down
    my waitForText(detailScroll, "Production year 2024", "Command-Return keyboard analysis did not produce a 2024 result")
    my assertMartinResult(appWindow, "keyboard command analysis")

    my require(my clickButtonWithIdentifier(toolbar 1 of appWindow, "clear-serial-button"), "Toolbar Clear button was not reachable after keyboard analysis")
    my waitForText(detailScroll, "Ready for a Martin serial", "Toolbar Clear did not restore the empty Martin result")

    my require(my clickButtonWithIdentifier(detailScroll, "sample-serial-2935987"), "Supported sample button was not reachable")
    my waitForText(detailScroll, "Production year 2024", "Martin sample did not produce a 2024 result")
    my assertMartinResult(appWindow, "sample analysis")

    set size of appWindow to {1180, 760}
    delay 0.5
    my assertCoreSurface(appWindow, "expanded window")
    my assertMartinResult(appWindow, "expanded window")

    my require(my clickButtonWithIdentifier(toolbar 1 of appWindow, "analyze-serial-button"), "Toolbar Analyze button was not reachable after sample analysis")
    my waitForText(my detailScrollFor(appWindow), "Production year 2024", "Toolbar Analyze did not preserve the Martin result")
    my assertMartinResult(appWindow, "toolbar analysis")
  end tell
end tell
APPLESCRIPT

printf '%s\n' "macOS UI assertions passed" >&2

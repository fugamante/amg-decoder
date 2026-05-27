# Gibson Decoder Interaction Summary

Date: 2026-05-02

## Documents

- Original rules document: local Gibson serial-number rules document.
- Polished copy created during this interaction: local polished Gibson serial-number rules document.

## Located Program

- Project folder: local Gibson serial-number decoder workspace.
- Xcode project: local Gibson serial-number decoder Xcode project.
- Source file: `main.cpp` in the local decoder project.

## Findings

- The decoder is a C++ command-line Xcode tool created on 2023-09-16.
- It appears to be an early prototype rather than a complete Gibson serial-number interpreter.
- It compiles directly with `clang++`, but `xcodebuild` failed because local Xcode has a plugin/framework mismatch involving `IDESimulatorFoundation`.
- No built executable was found in Xcode `DerivedData`.

## Behavior Checked

Examples from the rules document:

- `7 5123`: rejected as invalid.
- `050102`: rejected as invalid.
- `030084`: rejected as invalid.
- `A-38005`: crashes because the code reads a non-existent regex capture group.
- `91418009`: misparsed as production year `1941`, day `8`, rank `9`.
- `20045002`: misparsed as production year `194`, day `5`, rank `2`.
- `CS10845`: returns production rank `10845`.
- `ACE 123`: returns model code `ACE`, production rank `123`.
- `BONE 123`: returns model code `BONE`, production rank `123`.

## Likely Next Work

- Repair the regex groups and parsing logic in `main.cpp`.
- Add tests using examples from the polished rules document.
- Decide whether this should remain a C++ CLI, become a small macOS app, or be rebuilt as a web/desktop utility.

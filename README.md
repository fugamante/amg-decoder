# AMG Decoder

A planning workspace for a brand-first American-made guitar serial analyzer.

The project direction is to move beyond a single Gibson-focused decoder into a deterministic analyzer organized by brand. Users should choose a brand first, enter only the fields that matter for that brand, and receive a structured result with confidence, matched rule, warnings, and source attribution.

## Naming Status

`AMG Decoder` is the canonical product name and `amg-decoder` is the intended public repository slug. New product, package, app, and documentation surfaces should use AMG Decoder unless they are explicitly describing legacy Gibson-only artifacts.

Do not rename the local folder, repository remote, Swift package, app bundle, or generated artifacts as a side effect of feature work. Treat any remaining filesystem or distribution rename as a separate compatibility pass with validation for scripts, package metadata, native bundle identifiers, and public repository hygiene.

## Current Scope

- Gibson Custom Shop rule notes and test matrix.
- Product roadmap for a broader serial analyzer.
- First research slice for major electric and acoustic guitar brands.
- Research direction for American-made brands including Fender, PRS, Martin, and Collings.
- Source-backed Martin standard guitar/ukulele range analyzer with fixtures, validation, and a static brand-first UI.
- Source-backed Taylor serial analyzer for official 10-digit, 9-digit, 11-digit, 4-prefix, and scoped pre-1993 range rules.
- Source-backed PRS analyzer for official set-neck and S2 approximate sequence ranges.
- Source-backed Gibson analyzer for scoped official Gibson guitar serial formats.
- Source-backed Fender analyzer for scoped U.S.-made, Mexican-made, and Indonesian-made instrument serial formats, plus low-confidence V-prefix and Japan JD context guidance.
- Source-backed Epiphone analyzer for Gibson-documented scoped guitar serial formats.
- Source-backed Collings analyzer for official electric serial parsing plus acoustic records-assisted lookup guidance.
- Retired Suhr and Novo source-registry notes kept for provenance only; neither brand is exposed in product UI because public serial normalization is not reviewed.
- SwiftPM native foundation with a shared `AnalyzerCore` library and SwiftUI `AMGDecoderApp` target for iOS, iPadOS, and macOS readiness work.
- Committed local Xcode project with iOS/iPadOS and macOS app targets that produce installable development `.app` bundles without final signing metadata.
- Repeatable macOS app-window UI assertion validation for launch, sidebar visibility, minimum and expanded window layouts, keyboard-reachable serial input, Command-Return analysis, Martin sample analysis, toolbar Clear/Analyze reachability, source authority, accessibility-label contracts, and descriptive-only boundary copy.
- Repeatable iPhone simulator smoke validation that builds, installs, launches, and screenshots the local iOS app target.
- Repeatable compact iPhone simulator UI assertion validation for brand-list-to-detail navigation, Fender Mexico analysis, source authority, and descriptive-only boundary copy.
- Repeatable iPad simulator UI assertion validation for the Martin and Fender Mexico analyzer flows, visible source authority, and descriptive-only boundary copy.
- Placeholder native accent color asset catalog for Apple asset readiness without final app icon claims.

## Product Principles

- Brand-first analysis instead of broad serial guessing.
- Visible confidence for every result.
- Source-backed rules.
- Explicit warnings for overlapping, ambiguous, or unsupported serial systems.
- No claim of instrument authentication from serial number alone.

## Documents

- `serial-analyzer-roadmap.md`: product and implementation roadmap.
- `brand-research-slice-001.md`: first source-backed brand research slice.
- `brand-research-slice-002-amg.md`: AMG-focused research for Fender, PRS, Martin, Novo, and Collings, with Suhr/Novo treated as retired research context.
- `interaction-summary.md`: legacy Gibson prototype findings.
- `test-matrix.md`: legacy Gibson-focused test matrix.
- `docs/source-and-data-standards.md`: source registry, result contract, and product-boundary standards.
- `docs/martin-standard-ranges.md`: Martin standard guitar/ukulele range contract.
- `docs/taylor-serial-rules.md`: Taylor serial rule contract.
- `docs/prs-set-neck-ranges.md`: PRS set-neck and S2 range contract.
- `docs/gibson-serial-rules.md`: Gibson scoped official serial rule contract.
- `docs/fender-us-serial-rules.md`: Fender U.S.-made, Mexican-made, Indonesian-made, and Japan-context serial rule contract.
- `docs/epiphone-serial-rules.md`: Epiphone scoped official serial rule contract.
- `docs/collings-serial-rules.md`: Collings electric serial and acoustic guidance contract.
- `docs/apple-platform-readiness.md`: native app scope, source mirror workflow, Apple shipping checklist, and release blockers.
- `docs/apple-release-human-intake.md`: fillable human-owned checklist for the approved artwork, launch policy, screenshot policy, bundle IDs, signing, privacy, App Store metadata, and archive/export decisions required before release work.

## Data Artifacts

- `data/source-registry.json`: reviewed source registry.
- `data/active-brands.json`: canonical active product-surface manifest. Web/native navigation, data brand directories, tests, and retired-brand exclusions are validated against this file.
- `data/brands/martin/ranges.json`: official Martin standard guitar/ukulele serial range data.
- `data/brands/taylor/rules.json`: official Taylor serial rule data.
- `data/brands/prs/rules.json`: official PRS set-neck and S2 serial range data.
- `data/brands/gibson/rules.json`: official Gibson scoped guitar serial rule data.
- `data/brands/fender/rules.json`: official Fender U.S.-made, Mexican-made, Indonesian-made, and Japan-context serial rule data.
- `data/brands/epiphone/rules.json`: official Gibson-documented Epiphone guitar serial rule data.
- `data/brands/collings/rules.json`: official Collings electric serial rule and acoustic guidance data.
- `data/fixtures/martin_standard_guitars_ukuleles.json`: Martin range lookup fixtures.
- `data/fixtures/taylor_serial_rules.json`: Taylor serial rule fixtures.
- `data/fixtures/prs_set_neck_rules.json`: PRS set-neck and S2 range fixtures.
- `data/fixtures/gibson_serial_rules.json`: Gibson scoped serial rule fixtures.
- `data/fixtures/fender_us_serial_rules.json`: Fender serial rule fixtures. The filename is retained for compatibility with earlier U.S.-only resource paths.
- `data/fixtures/epiphone_serial_rules.json`: Epiphone scoped serial rule fixtures.
- `data/fixtures/collings_serial_rules.json`: Collings electric and acoustic guidance fixtures.
- `schemas/analyzer-result.schema.json`: shared descriptive-only result contract.
- `web/`: static brand-first analyzer UI, manifest-hydrated brand rail, and shared analyzer module.
- `Sources/AnalyzerCore/`: Swift analyzer library with bundled source-backed resource mirrors and active-brand manifest metadata lookup.
- `Sources/AMGDecoderApp/`: SwiftUI app shell for the native Apple-platform experience. Native brand display/status metadata is read from the active-brand manifest while analyzer routing remains static.
- `Tests/AnalyzerCoreTests/`: native fixture parity tests against the same source-backed cases.
- `Tests/AMGDecoderUITests/`: Xcode UI assertions for the committed iOS/iPadOS app target.
- `AMGDecoder.xcodeproj/`: committed local Xcode project with `AMGDecoderApp-iOS` and `AMGDecoderApp-macOS` schemes. Both depend on the local `AnalyzerCore` Swift package product.
- `AppAssets/Assets.xcassets/`: local asset catalog with an `AccentColor` color set only. It does not define a final app icon set.
- `data/apple-final-asset-acceptance.json`: machine-readable final asset acceptance contract for app icon source artwork, `AppIcon.appiconset` generation prerequisites, launch asset decisions, and App Store screenshot policy. It remains blocked until approved product-owned values exist.
- `scripts/sync_native_resources.sh`: refreshes SwiftPM resource mirrors from canonical `data/` artifacts, including the active-brand manifest.
- `scripts/test_static_ui.mjs`: dependency-free UI contract check for accessibility hooks, retired research-brand absence, and product-boundary copy.
- `scripts/test_active_surface_contract.mjs`: cross-surface contract check that manifest-hydrated web navigation, native navigation, data brand directories, retired-brand provenance, and roadmap status stay aligned.
- `scripts/test_native_ui_contract.mjs`: static SwiftUI contract check for adaptive native layout, toolbar/keyboard affordances, accessibility identifiers, accessibility labels/hints, result/scope/footer grouping, and product-boundary copy.
- `scripts/test_apple_packaging_contract.mjs`: static packaging-readiness check for the local macOS app bundle run path.
- `scripts/test_macos_ui_contract.mjs`: static macOS UI assertion contract check for the local app-window resize/toolbar script, accessibility-mode readiness notes, and release-boundary hygiene.
- `scripts/test_xcode_project_contract.mjs`: static Xcode project contract check for shared schemes, local-only bundle identifiers, `AnalyzerCore` linkage, and absence of premature signing metadata.
- `scripts/test_xcode_readiness_contract.mjs`: static Xcode-readiness contract check for the repeatable macOS, iPhone simulator, and iPad simulator build script.
- `scripts/test_simulator_smoke_contract.mjs`: static simulator-smoke contract check for the build/install/launch/screenshot script.
- `scripts/test_simulator_ui_contract.mjs`: static simulator UI assertion contract check for the Xcode UI test target, shared iOS scheme wiring, local-only metadata, and timeout-bounded UI test runner.
- `scripts/test_apple_release_contract.mjs`: static Apple release-readiness boundary check for privacy, icon, signing, App Store metadata, and generated artifact hygiene.
- `scripts/check_apple_release_readiness.mjs`: diagnostics-only release artifact audit for generated-output ignores, local-only bundle identifiers, privacy-sensitive API absence, final-icon absence, archive/export-option absence, and documented release blockers.
- `scripts/test_release_metadata_intake_contract.mjs`: release metadata intake contract check for product-owned identity, signing, privacy, final-asset, store-listing, and archive/export decisions.
- `scripts/dry_run_release_metadata_application.mjs`: read-only release metadata application dry run. It reports bundle ID, signing, privacy, asset, App Store listing, and archive/export target areas as `blocked_pending_metadata` until approved intake values exist.
- `scripts/test_release_metadata_dry_run_contract.mjs`: static contract for the release metadata dry-run command.
- `scripts/test_final_asset_acceptance_contract.mjs`: final asset acceptance contract check for product-owned app icon source artwork, `AppIcon.appiconset` prerequisites, launch asset policy, App Store screenshot policy, and continued absence of premature final assets.
- `data/apple-release-metadata-intake.json`: machine-readable release metadata intake template. All values remain `null` and `pending_product_decision` until an explicit release metadata pass supplies approved values.
- `script/build_and_run.sh`: local macOS build/run entrypoint that stages `dist/AMG Decoder.app` from the SwiftPM executable target.
- `script/check_macos_ui.sh`: local macOS UI assertion check that launches the development app and verifies window resizing, sidebar, keyboard serial input, Command-Return analysis, Martin result, toolbar Clear/Analyze reachability, source link, and product-boundary footer through macOS Accessibility.
- `script/check_xcode_readiness.sh`: local Xcode toolchain and SwiftPM scheme build check for macOS, iPhone simulator, and iPad simulator.
- `script/check_simulator_smoke.sh`: local iPhone simulator smoke check that builds, installs, launches, screenshots, and terminates the app.
- `script/check_simulator_iphone_ui.sh`: local compact iPhone simulator UI assertion check that runs the targeted compact navigation XCTest through the shared Xcode UI runner.
- `script/check_simulator_ui.sh`: local iPad simulator UI assertion check that runs `AMGDecoderUITests` through `xcodebuild test` and writes an `.xcresult` bundle.

## Validation

Run the current repository checks with:

```sh
npm test
```

Run native Swift package validation with:

```sh
swift test
```

Build and launch the local macOS development app bundle with:

```sh
script/build_and_run.sh
```

Verify that the staged app process launches with:

```sh
script/build_and_run.sh --verify
```

This creates a local unsigned `dist/AMG Decoder.app` bundle for development only. It does not create a shipping Xcode archive, signing profile, App Store record, or final bundle identifier.

Run macOS app-window UI assertions with:

```sh
npm run test:macos:ui
```

The macOS UI assertion check launches the local development app and verifies the default Martin analyzer flow, minimum and expanded window layouts, keyboard-reachable serial input, Command-Return analysis, toolbar Clear/Analyze reachability, visible source authority, and descriptive-only footer. Static native contracts also guard accessibility labels and hints for the macOS surface. Runtime VoiceOver, reduced-transparency, Dynamic Type, and full Tab-order traversal remain release-review items. The macOS UI script requires Accessibility permission for the invoking terminal or automation host.

When Xcode and matching simulator runtimes are installed, run the committed Xcode project readiness check with:

```sh
npm run test:xcode
```

The Xcode readiness check builds the committed `AMGDecoderApp-macOS` and `AMGDecoderApp-iOS` schemes for macOS, iPhone simulator, and iPad simulator. It uses local-only bundle identifiers under `app.amgdecoder.local.*` and does not create a signing identity, provisioning profile, App Store record, or production bundle identifier.

Run an iPhone simulator smoke check with:

```sh
npm run test:simulator
```

The simulator smoke check writes its screenshot under `dist/simulator-smoke/`, which is local generated output. It verifies iPhone install/launch/screenshot behavior; use the separate simulator UI assertion check for XCTest-driven analyzer-flow assertions.

Run iPad simulator UI assertions with:

```sh
npm run test:simulator:ui
```

The simulator UI assertion check defaults to the local iPad simulator configured in `script/check_simulator_ui.sh` and can be overridden with `SIMULATOR_ID` or `SIMULATOR_DESTINATION`. It writes its result bundle under `dist/simulator-ui/AMGDecoderUITests.xcresult`.

Run compact iPhone simulator UI assertions with:

```sh
npm run test:simulator:iphone:ui
```

The compact iPhone UI assertion check targets the local iPhone simulator configured in `script/check_simulator_iphone_ui.sh`. It verifies brand-list-to-detail navigation before analyzer input and writes its result bundle under `dist/simulator-iphone-ui/AMGDecoderCompactIPhoneUITests.xcresult`.

Run release artifact and archive-readiness contract checks with:

```sh
npm run test:release:readiness
```

This diagnostics-only audit checks release hygiene without creating archives, export options, signing material, final icons, privacy manifests, or App Store artifacts.

Run release metadata intake contract checks with:

```sh
npm run test:release:intake
```

This verifies that required release metadata is explicitly listed but still unfilled. Required sections cover identity, signing, privacy, final assets, store listing, and archive/export decisions.

Run final asset acceptance contract checks with:

```sh
npm run test:release:assets
```

This verifies `data/apple-final-asset-acceptance.json`, the blocked Final Asset Acceptance contract for app icon source artwork, `AppIcon.appiconset` generation prerequisites, launch asset decisions, and App Store screenshot policy. It also checks that placeholder-only asset state remains intact and no final app icons, screenshots, or release artifacts have been committed. Apple authority references for the contract are tracked in `docs/apple-platform-readiness.md`, including App icon guidance and Screenshot specifications.

## Release Metadata Application Dry Run

Preview release metadata application with:

```sh
npm run dry-run:release:metadata
```

The dry run is read-only. It reports the exact target areas that would change in a future dedicated apply pass and must report `blocked_pending_metadata` while intake values remain pending.

Dry-run statuses:

- `blocked_pending_metadata`: required intake fields are pending or null, so no apply pass may proceed.
- `ready_for_dedicated_apply_pass`: required fields are approved and non-empty, so a separate reviewed apply pass may be proposed.

Validate the dry-run contract with:

```sh
npm run test:release:dry-run
```

After changing canonical data artifacts, refresh native resources before Swift validation:

```sh
scripts/sync_native_resources.sh
```

To run only the data artifact validation:

```sh
python3 scripts/validate_data.py
```

To try the static analyzer locally:

```sh
npm run serve
```

Then open `http://localhost:4173/web/`.

## Recommended Next Work

1. Extend native UI assertions to runtime macOS Tab-order traversal and accessibility modes without weakening the current iPhone, iPad, macOS app-window, keyboard command, and static accessibility-label contracts.
2. Collect approved release metadata through `data/apple-release-metadata-intake.json` before changing bundle IDs, signing, privacy manifests, App Store listing fields, final icons, or archive/export workflows.
3. Add final app icon, launch assets, and App Store screenshots only after product-owned artwork and `data/apple-final-asset-acceptance.json` are approved.
4. Expand Fender only through separate Japan date-decoding, Korea, Custom Shop, acoustic, amplifier, export, special-run, Mexico-exception, and Indonesia post-2012 flows after scoped authority review.
5. Expand Gibson only through separate artist signature, Dobro, banjo, and undocumented exception flows after scoped authority review.

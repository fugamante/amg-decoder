# Apple Platform Readiness

AMG Decoder now has a SwiftPM-first native foundation plus a committed local Xcode app project for iOS, iPadOS, and macOS. The package keeps the existing source-backed web analyzer intact while adding a shared Swift `AnalyzerCore` library and SwiftUI app targets.

## Current Native Scope

- `AnalyzerCore`: deterministic, offline analyzer library for Martin, Taylor, PRS, Gibson, Fender, Epiphone, and Collings.
- `AMGDecoderApp`: SwiftUI shell for macOS/iOS/iPadOS with brand selection, serial input, sample cases, confidence, matched rule, warnings, source attribution, adaptive result layouts, toolbar actions, keyboard submit, and accessibility identifiers, labels, hints, grouping, and sort priorities for UI automation and assistive technology review.
- `AMGDecoder.xcodeproj`: committed local Xcode project with `AMGDecoderApp-iOS` and `AMGDecoderApp-macOS` schemes. Both targets reuse the SwiftUI source and depend on the local `AnalyzerCore` Swift package product.
- `AppAssets/Assets.xcassets`: local native asset catalog with an `AccentColor` color set only. It intentionally does not define a final app icon set.
- Native resources: mirrored JSON from the canonical `data/` directory.
- Native tests: fixture parity for all current Martin, Taylor, PRS, Gibson, Fender, Epiphone, and Collings cases.
- Local macOS run path: `script/build_and_run.sh` stages an unsigned development-only `dist/AMG Decoder.app` bundle from the SwiftPM executable target and copies SwiftPM resource bundles needed by `AnalyzerCore`.
- Xcode readiness path: `script/check_xcode_readiness.sh` verifies the local Xcode toolchain, inspects committed project schemes and destinations, and builds installable local app bundles for macOS, iPhone simulator, and iPad simulator when matching simulator runtimes are installed.
- macOS UI assertion path: `script/check_macos_ui.sh` launches the local development app bundle and uses macOS Accessibility via System Events to assert the app window, sidebar, minimum-size window layout, expanded window layout, Martin analyzer surface, keyboard-reachable serial input, Command-Return analysis, toolbar Clear and Analyze reachability, Source link, and descriptive-only footer.
- Simulator smoke path: `script/check_simulator_smoke.sh` builds the committed iOS target, boots an iPhone simulator when needed, installs and launches the local app bundle, captures a screenshot under `dist/simulator-smoke/`, and terminates the app.
- Compact iPhone UI assertion path: `script/check_simulator_iphone_ui.sh` runs the targeted compact navigation XCTest on an iPhone simulator, asserting brand-list-to-detail navigation before analyzer input, source authority, and descriptive-only boundary copy.
- iPad UI assertion path: `AMGDecoderUITests` plus `script/check_simulator_ui.sh` runs Martin and Fender Mexico analyzer flows on an iPad simulator through `xcodebuild test`, asserting the app title, sidebar contract, serial input, analyze action, production result wording, visible source authority, and descriptive-only boundary copy.

## Naming Boundary

`AMG Decoder` is the canonical product name for Apple-platform planning. The current local workspace may still use the original Gibson Decoder folder name, but app display names, package naming, metadata drafts, and public-facing docs should use AMG Decoder.

Do not replace the local-only Xcode bundle identifiers, add signing-team metadata, create an App Store record, or rename the repository until the exact display name, production bundle identifier, signing team, icon set, and public repository slug are confirmed together.

## Canonical Sources

The canonical source-backed artifacts remain under `data/`. Native resource files are generated mirrors used by SwiftPM resource bundling.

Refresh native mirrors after changing canonical data:

```sh
scripts/sync_native_resources.sh
```

Then run:

```sh
swift test
npm test
```

`npm test` includes `scripts/test_native_ui_contract.mjs`, which guards the SwiftUI shell for adaptive layout primitives, toolbar/keyboard affordances, accessibility identifiers, accessibility labels and hints, result/scope/footer grouping, and the visible non-authentication boundary statement.

`npm test` also includes `scripts/test_apple_packaging_contract.mjs`, which guards the local app-bundle run path, required `Info.plist` keys, SwiftPM resource-bundle copying, and absence of premature signing/profile metadata.

`npm test` includes `scripts/test_xcode_project_contract.mjs`, which guards the committed Xcode project, shared schemes, local-only bundle identifiers, `AnalyzerCore` package dependency, and absence of premature signing/profile metadata.

`npm test` includes `scripts/test_xcode_readiness_contract.mjs`, which guards the repeatable Xcode readiness script without requiring Xcode during the normal JavaScript test suite.

`npm test` includes `scripts/test_simulator_smoke_contract.mjs`, which guards the simulator smoke script without requiring simulator runtime during the normal JavaScript test suite.

`npm test` includes `scripts/test_simulator_ui_contract.mjs`, which guards the committed UI test target, iOS scheme test action, local-only UI-test bundle identifier, timeout-bounded runner, and absence of premature signing/profile metadata.

`npm test` includes `scripts/test_apple_release_contract.mjs`, `scripts/test_release_metadata_intake_contract.mjs`, `scripts/test_release_metadata_dry_run_contract.mjs`, `scripts/test_final_asset_acceptance_contract.mjs`, and `scripts/check_apple_release_readiness.mjs`, which guard release artifact hygiene, generated-output ignores, local-only bundle identifiers, privacy-sensitive API absence, final-icon absence, archive/export-option absence, release metadata intake completeness, final asset acceptance blockers, dry-run application reporting, and the documented release blockers.

For local macOS development launch:

```sh
script/build_and_run.sh
```

For launch verification:

```sh
script/build_and_run.sh --verify
```

The generated `dist/AMG Decoder.app` bundle is intentionally unsigned and local-only. It is not an App Store archive and does not settle the final bundle identifier, signing team, icon set, or distribution metadata.

For macOS app-window UI assertions on machines with Accessibility permission for the invoking terminal:

```sh
npm run test:macos:ui
```

This launches the local development app through `script/build_and_run.sh --verify`, checks that the AMG Decoder window and sidebar appear at minimum-size window and expanded window sizes, focuses the Martin serial input through its stable accessibility identifier, types a serial number, runs analysis with Command-Return, clears the result through the toolbar Clear action, activates the default Martin sample result, verifies the Martin production-year result and Source link, re-runs analysis through the toolbar Analyze action, and preserves the descriptive-only footer.

Accessibility-mode readiness is currently contract-driven rather than runtime VoiceOver automation. The SwiftUI surface has explicit accessibility labels and hints for brand navigation, analyzer forms, serial inputs, result summaries, scope metadata, and the product-boundary footer. The macOS script verifies keyboard command reachability for the focused serial input and toolbar command reachability through stable accessibility identifiers. Reduced transparency and Dynamic Type remain release-review modes: the app uses SwiftUI text styles and system materials, but runtime checks for those modes are not yet automated.

For Xcode scheme build readiness on machines with Xcode and matching simulator runtimes:

```sh
npm run test:xcode
```

This checks the committed `AMGDecoderApp-macOS` and `AMGDecoderApp-iOS` schemes against macOS, iPhone simulator, and iPad simulator destinations. It proves local app-bundle build readiness, not archive readiness, final signing, or App Store distribution readiness.

For simulator launch smoke validation on machines with Xcode and the configured simulator runtime:

```sh
npm run test:simulator
```

This checks local iPhone simulator install and launch, then captures a screenshot artifact under `dist/simulator-smoke/`. It is not a substitute for UI assertions or accessibility automation.

For simulator UI assertions on machines with Xcode and the configured iPad simulator runtime:

```sh
npm run test:simulator:ui
```

This runs `AMGDecoderUITests` against the committed `AMGDecoderApp-iOS` scheme and writes `dist/simulator-ui/AMGDecoderUITests.xcresult`. The script defaults to the configured local iPad simulator and can be pointed at another iPadOS destination with `SIMULATOR_ID` or `SIMULATOR_DESTINATION`.

For compact iPhone UI assertions on machines with Xcode and the configured iPhone simulator runtime:

```sh
npm run test:simulator:iphone:ui
```

This runs only `testCompactIPhoneNavigationAnalyzerFlow` against the committed `AMGDecoderApp-iOS` scheme and writes `dist/simulator-iphone-ui/AMGDecoderCompactIPhoneUITests.xcresult`. It verifies that compact iPhone starts on the brand list, excludes retired brands, navigates into Fender detail, analyzes `MX17123456`, shows source authority, and preserves the descriptive-only footer.

For release artifact and archive-readiness contract checks:

```sh
npm run test:release:readiness
```

This is a diagnostics-only audit. It verifies that local build outputs and release artifacts are ignored, no `.xcarchive`, `.ipa`, `ExportOptions.plist`, provisioning profile, certificate, entitlement, final icon, or privacy manifest is committed, local-only bundle identifiers remain in place, and no reviewed privacy-sensitive API or permission string has been introduced. It does not create an archive, export an app, notarize a build, contact App Store Connect, or settle final signing metadata.

For release metadata intake contract checks:

```sh
npm run test:release:intake
```

This verifies `data/apple-release-metadata-intake.json`, the machine-readable list of product-owned decisions required before archive/signing/privacy/App Store/final-asset work can begin. Every field is intentionally `pending_product_decision` with a `null` value until reviewed by the product owner.

For final asset acceptance contract checks:

```sh
npm run test:release:assets
```

This verifies `data/apple-final-asset-acceptance.json`, the machine-readable acceptance contract for app icon source artwork, `AppIcon.appiconset` generation prerequisites, launch asset decisions, and App Store screenshot policy. It must remain blocked until product-owned artwork, review ownership, launch decisions, and screenshot policy are supplied in a dedicated final asset pass.

For release metadata application dry runs:

```sh
npm run dry-run:release:metadata
```

This reads `data/apple-release-metadata-intake.json` and reports the exact target areas that would change in a future dedicated apply pass: bundle identifiers, signing and provisioning, privacy/App Store privacy, final assets, store listing, and archive/export workflow. With the current intake file it must report `blocked_pending_metadata` for every area. It does not write files, run `xcodebuild`, create `PrivacyInfo.xcprivacy`, add `AppIcon.appiconset`, create `ExportOptions.plist`, submit to App Store Connect, notarize, or create release artifacts.

To validate the dry-run contract:

```sh
npm run test:release:dry-run
```

## Product Boundary

The native app must remain descriptive-only:

- No rankings, recommendations, scores, or valuation language.
- No legal, zoning, finance, authentication, or ownership conclusions.
- No invented coordinates or inferred institution facts.
- No unsupported brand facts or expanded serial systems without reviewed source authority and fixtures.
- Quarantined rows stay unsupported unless row-level authority resolves them.

## Apple Shipping Checklist

- Keep the committed Xcode project local-only until a real bundle identifier, signing team, icon set, and app naming decision are approved.
- Replace the local-only `app.amgdecoder.local` bundle identifier with an approved distribution identifier before archive/signing work.
- Extend UI/snapshot coverage from the current iPhone/iPad/macOS analyzer-flow assertions and macOS keyboard command checks to broader macOS focus traversal and runtime accessibility-mode checks.
- Add App Store privacy nutrition labels. Current implementation is offline and should not collect user serial inputs unless telemetry is deliberately introduced.
- Replace the placeholder accent-only asset catalog with final app icons and launch assets using Apple HIG-compliant native assets, not generated screenshots.
- Verify VoiceOver labels, Dynamic Type, reduced transparency, keyboard navigation, and macOS window resizing. Static accessibility labels and hints plus Command-Return keyboard analysis are now guarded; runtime VoiceOver, reduced-transparency, Dynamic Type, and full Tab-order traversal remain manual until a stable automation path is added.
- Add localized disclaimers before any non-English release.
- Keep source registry review dates visible in release notes when data changes.

Apple authority references used for this checklist:

- [Preparing your app for distribution](https://developer.apple.com/documentation/xcode/preparing-your-app-for-distribution/)
- [Configuring a multiplatform app target](https://developer.apple.com/documentation/xcode/configuring-a-multiplatform-app-target)
- [App privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
- [App privacy](https://developer.apple.com/help/app-store-connect/reference/app-information/app-privacy/)
- [Describing use of required reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)
- [Configuring your app icon using an asset catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
- [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [Upload app previews and screenshots](https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/)
- [Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/)
- [SwiftUI](https://developer.apple.com/documentation/swiftui)

## Release Contract

`scripts/test_apple_release_contract.mjs` guards the local release-readiness boundary. The contract is intentionally conservative: it verifies that shipping blockers are visible and that the repository does not imply final Apple distribution metadata before product-owned decisions exist.

### Release Artifact Readiness

`scripts/check_apple_release_readiness.mjs` is the operator-facing release audit. It is intentionally non-interactive and read-only. Run it when release-facing files, Xcode project settings, packaging scripts, `.gitignore`, privacy-related source code, or asset catalogs change.

Do not create `.xcarchive`, `.ipa`, `ExportOptions.plist`, provisioning profiles, distribution certificates, notarization credentials, final app icons, App Store screenshots, or `PrivacyInfo.xcprivacy` as part of ordinary implementation passes. Those artifacts require a dedicated release metadata pass with an approved bundle identifier, signing team, privacy answers, icon artwork, and distribution target.

Archive/export readiness remains a blocker until:

- Product-owned bundle identifiers replace the local `app.amgdecoder.local.*` identifiers.
- A signing team, provisioning strategy, and distribution certificate policy are approved.
- App Store privacy answers and any required privacy manifest are reviewed against the final dependency/API surface.
- Final icon and launch assets are approved and added through an explicit asset pass.
- Archive/export commands and export options are added in a dedicated release workflow rather than ordinary local validation.

### Release Metadata Intake

`data/apple-release-metadata-intake.json` is the canonical metadata intake template. It is intentionally a blocker: the file lists required release decisions, but every value must remain `null` and `pending_product_decision` until a human supplies approved release metadata in a dedicated pass.

`docs/apple-release-human-intake.md` is the human-facing worksheet for collecting those decisions. It is not approval by itself; approved values still need to be transferred into the machine-readable intake contracts in a dedicated release metadata pass.

The intake file currently requires product-owned decisions in these sections:

- `identity`: `approved_display_name`, `production_bundle_id_ios`, `production_bundle_id_macos`, `app_store_sku`, and `copyright_holder`.
- `signing`: `apple_developer_team_id`, `provisioning_strategy`, `distribution_certificate_policy`, and `entitlements_and_capabilities`.
- `privacy`: `privacy_policy_url`, `app_store_privacy_answers`, `required_reason_api_review`, `privacy_manifest_decision`, and `third_party_sdk_privacy_review`.
- `assets`: `app_icon_source_artwork`, `app_icon_review_owner`, `launch_asset_decision`, and `app_store_screenshot_policy`.
- `store_listing`: `subtitle`, `description`, `keywords`, `support_url`, `age_rating`, and `content_rights`.
- `archive_export`: `distribution_channel`, `archive_scheme_policy`, `export_method`, `export_options_owner`, and `mac_notarization_decision`.

Do not infer or fill these values from the local project. Local `MARKETING_VERSION`, local-only bundle IDs, placeholder accent color, generated launch settings, and descriptive product docs are not substitutes for approved release metadata.

### Final Asset Acceptance

`data/apple-final-asset-acceptance.json` is the canonical final asset acceptance contract. It is intentionally blocked with `asset_metadata_required` until a product owner supplies approved source artwork, review ownership, launch asset decisions, and App Store screenshot policy in a dedicated asset pass.

The acceptance contract covers:

- `app_icon_source_artwork`: product-owned source artwork, review owner, and Light/Dark/Tinted appearance decision before any icon generation.
- `app_icon_asset_catalog`: prerequisites for generating and committing `AppIcon.appiconset` and setting `ASSETCATALOG_COMPILER_APPICON_NAME`.
- `launch_asset_decision`: whether AMG Decoder keeps default SwiftUI launch behavior or adds product-owned launch artwork.
- `app_store_screenshot_policy`: real app UI capture policy, platform coverage, Light/Dark review, source attribution, and descriptive-only screenshot text.

Current blocked outputs include `AppIcon.appiconset`, `.icon` files, `ASSETCATALOG_COMPILER_APPICON_NAME`, custom launch artwork, App Store screenshots, and screenshot marketing copy. Apple documents app icon configuration through asset catalogs and publishes App Store screenshot specifications, including supported file formats and platform-specific screenshot size requirements. AMG Decoder must not add those final assets until the acceptance contract and `data/apple-release-metadata-intake.json` agree on approved product-owned values.

Validate this contract with:

```sh
npm run test:release:assets
```

### Release Metadata Application Dry Run

`scripts/dry_run_release_metadata_application.mjs` is the only approved path for previewing release metadata application while metadata remains incomplete. It is read-only and report-only.

The dry run reports:

- `bundle_ids`: future `PRODUCT_BUNDLE_IDENTIFIER` replacements for iOS/iPadOS and macOS.
- `signing`: future signing team, provisioning, certificate policy, and entitlement/capability changes.
- `privacy`: future privacy manifest and App Store privacy-answer work.
- `assets`: future final app icon, launch asset, and App Store screenshot work.
- `store_listing`: future App Store listing metadata work.
- `archive_export`: future archive/export command, export-options, distribution-channel, and notarization workflow work.

The dry run has two statuses:

- `blocked_pending_metadata`: required fields are still `pending_product_decision` or `null`; no apply pass may proceed.
- `ready_for_dedicated_apply_pass`: required fields are approved and non-empty; a separate apply pass may be proposed, reviewed, and validated.

The current expected status for every dry-run area is `blocked_pending_metadata`.

Privacy and permission surface:

- The current native app is offline and uses bundled source-backed JSON resources. It does not declare location, camera, contacts, photo library, tracking, telemetry, or network collection hooks.
- No `PrivacyInfo.xcprivacy` file is committed yet because there is no reviewed required-reason API or data-collection declaration to encode.
- Before any App Store upload, complete a privacy review against Apple privacy details, App Store Connect app privacy responses, Privacy Policy URL requirements, the `privacy` section of `data/apple-release-metadata-intake.json`, and any Required-reason API usage introduced by app or dependency changes.
- If a privacy manifest is added later, it must be reviewed alongside source changes, App Store privacy answers, and tests that verify the manifest is bundled by the Xcode targets.

App icon and launch assets:

- `AppAssets/Assets.xcassets` currently contains only `AccentColor`.
- The Xcode project intentionally does not set `ASSETCATALOG_COMPILER_APPICON_NAME` and does not contain an `AppIcon.appiconset` or `.icon` file.
- Xcode-generated launch screen settings may remain for local app-bundle readiness, but final app icon and launch assets require approved product-owned artwork, `data/apple-final-asset-acceptance.json` approval, and an explicit asset pass.
- App Store screenshot capture must use real app UI and reviewed copy that does not imply authentication, exact model identity, value, ownership, warranty eligibility, or unsupported serial coverage.

Generated artifact hygiene:

- Local build outputs stay under ignored paths such as `dist/`, `.build/`, and `DerivedData/`.
- Generated release artifacts stay ignored, including `.xcarchive`, `.ipa`, `.dSYM`, `ExportOptions.plist`, provisioning profiles, and provision profiles.
- Do not commit `.xcarchive`, `.ipa`, export options, provisioning profiles, entitlements, final app icons, App Store screenshots, certificates, or notarization credentials as side effects of implementation work.

Do not add a production bundle identifier, signing team, provisioning profile, App Store record, archive export options, final icon set, or privacy manifest without an explicit release metadata pass.

## Release Blockers

- No production bundle identifier, signing entitlements, archive workflow, final icon set, or App Store metadata exists yet.
- The public distribution name, approved bundle identifier, icon set, signing team, privacy answers, App Store listing fields, archive/export method, and repository/folder rename plan need one explicit compatibility pass before shipping.
- The committed Xcode project produces local installable app bundles for macOS, iPhone simulator, and iPad simulator. iPhone simulator smoke validation, compact iPhone UI assertions, iPad UI assertions, macOS resize/app-window UI assertions, static macOS accessibility-label contracts, and macOS Command-Return analyzer assertions exist, but broader macOS Tab-order traversal, runtime accessibility-mode checks, and archive/signing workflows are still needed for shipping workflows.
- Gibson artist signature, Epiphone, Dobro, banjo, and undocumented exception formats remain unsupported pending scoped authority review.
- Fender Japan date decoding, Custom Shop, Korea, acoustic, amplifier, export, special-run, Mexico exception, and Indonesia post-2012 flows remain unsupported pending scoped authority review.
- PRS CE, SE, EG, Swamp Ash, bass, acoustic, amplifier, and cabinet flows remain unsupported pending scoped authority review.
- Taylor and Martin extensions require new official-source fixtures before implementation.

## Recommended Next Direction

Use the release metadata intake contract to collect approved product-owned values, then run a dedicated compatibility pass that applies only the approved bundle IDs, signing strategy, privacy decisions, final assets, and archive/export workflow. Keep `AnalyzerCore` as the shared contract layer so web and native behavior can continue to be tested against the same source-backed fixtures.

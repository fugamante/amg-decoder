# Source and Data Standards

Date: 2026-06-23

AMG Decoder data artifacts must stay descriptive-only and source-backed. A brand rule can enter a production data path only when its source, scope, exclusions, fixtures, and warnings are explicit.

## Source Registry

Canonical registry: `data/source-registry.json`.

Each source entry must include:

- Stable `id`.
- Publisher and URL.
- Source tier.
- Last reviewed date.
- Rule use.
- Scope notes and product-boundary notes when the source can be overread.

Allowed tiers:

- `official`: manufacturer support or documentation.
- `manufacturer_adjacent`: regional manufacturer page, catalog, warranty page, or archived manufacturer document.
- `community`: wiki, forum, collector page, or third-party decoder.
- `unverified`: search result, anecdote, undocumented claim.

Only `official` and carefully scoped `manufacturer_adjacent` sources should drive high-confidence rules. Community sources can seed research or explicitly low-confidence helper flows, but should not silently become production rules.

Research-only brand entries may cite official warranty, registration, contact, or product pages to explain why a brand appears in the roadmap. Those entries may have read-only guidance pages only after an explicit product decision, and must stay out of analyzer-enabled brand IDs unless the source publishes a reusable serial rule or the product explicitly adds a low-confidence research helper with separate non-official evidence labels. Retired research brands should remain out of product UI rows and exist only as provenance notes.

## Active Brand Manifest

Canonical active product-surface manifest: `data/active-brands.json`.

The manifest lists every brand that may appear in analyzer navigation and every retired brand that is intentionally excluded from product UI. Active entries must reference an existing canonical `data/brands/...` artifact and use `surface: "analyzer"`. Retired entries must explain the provenance-only exclusion and must not imply decoder support.

The web brand rail is hydrated from this manifest at runtime. Do not reintroduce hard-coded `data-brand` rows in `web/index.html`; `scripts/test_active_surface_contract.mjs` treats static brand rows as product-surface drift.

Native `BrandID` remains the static analyzer routing enum, but user-facing native brand display names and status labels should come from `ActiveBrandManifest.activeBrand(for:)`. Do not reintroduce `BrandID.displayName` or `BrandID.status` switches; `scripts/test_native_ui_contract.mjs` treats those switches as metadata drift.

The SwiftPM resource mirror at `Sources/AnalyzerCore/Resources/Data/active-brands.json` is generated from the canonical manifest by:

```sh
scripts/sync_native_resources.sh
```

Do not edit the mirrored resource directly. Update the canonical manifest, sync native resources, and run validation.

## Result Contract

Canonical contract: `schemas/analyzer-result.schema.json`.

Every analyzer result fixture or implementation should return:

- `brand`
- `input`
- `confidence`
- `matched_rule`
- `decoded`
- `warnings`
- `sources`

Confidence values are `high`, `medium`, `low`, and `unsupported`.

Stable rule IDs are automation contract keys. Do not rename, remove, or repurpose them without a compatibility note and fixture update.

## Product Boundary

Analyzer output may describe likely production facts supported by cited sources. It must not make rankings, recommendations, scores, authentication claims, legal conclusions, zoning conclusions, financial conclusions, invented coordinates, inferred institution facts, or unsupported claims.

Every serial lookup module needs warnings for serial-only limitations when the source cannot establish exact build date, model identity, or authenticity.

## Validation

Run the data contract check before changing source-backed artifacts:

```sh
npm test
```

This check currently enforces the source registry, active-brand manifest, shared result contract, Martin standard guitar/ukulele range fixtures, Taylor serial rule fixtures, PRS set-neck range fixtures, Gibson serial rule fixtures, Fender U.S., Mexico, Indonesia, and Japan-context serial rule fixtures, Epiphone serial rule fixtures, Collings electric/acoustic-guidance fixtures, the JavaScript analyzer module used by the static web UI, browser accessibility smoke checks, static web accessibility/product-boundary hooks, native SwiftUI accessibility/product-boundary hooks, the local Apple packaging run-path contract, the static Xcode project contract, the static Xcode readiness contract, and the static simulator smoke contract.

## UI Contract

The static UI must keep:

- A keyboard skip link to the analyzer.
- A labeled live result region.
- Visible source attribution for analyzer results.
- Visible brand enablement only when source-backed rules and fixtures exist.
- Research-only brand guidance must expose why analyzer output is unavailable instead of implying a hidden decoder.
- A visible non-authentication boundary statement.
- Mobile constraints that prevent page-level horizontal overflow.

Run `npm test` after changing `web/` so `scripts/test_static_ui.mjs` can catch drift in those invariants.

## Native UI Contract

The SwiftUI app shell must keep:

- A `NavigationSplitView` brand-first shell.
- Adaptive layout primitives for form, result, scope, and footer content.
- Toolbar and keyboard paths for the primary analyze action.
- Accessibility identifiers for future simulator UI automation.
- A visible non-authentication boundary statement.

Run `npm test` after changing `Sources/AMGDecoderApp/` so `scripts/test_native_ui_contract.mjs` can catch drift before an Xcode UI-test target exists.

## Apple Packaging Contract

The local Apple packaging path must keep:

- `script/build_and_run.sh` as the local development app launch entrypoint.
- A development-only `dist/AMG Decoder.app` bundle staged from the SwiftPM `AMGDecoderApp` product.
- Required `Info.plist` bundle keys for local macOS launch.
- SwiftPM resource bundles copied into the staged app so source-backed analyzer data loads at runtime.
- No signing team, provisioning profile, App Store archive, or final distribution bundle identifier claim until those decisions are approved.

Run `npm test` after changing packaging scripts so `scripts/test_apple_packaging_contract.mjs` can catch drift.

## Xcode Readiness Contract

The committed Xcode project must keep:

- `AMGDecoder.xcodeproj` with shared `AMGDecoderApp-iOS` and `AMGDecoderApp-macOS` schemes.
- Both app targets depending on the local `AnalyzerCore` Swift package product rather than duplicating analyzer logic.
- Local-only bundle identifiers under `app.amgdecoder.local.*` until production identifiers are approved.
- `AppAssets/Assets.xcassets` may provide placeholder native assets such as `AccentColor`, but must not claim final app iconography until approved artwork exists.
- No signing team, provisioning profile, App Store archive, or final distribution bundle identifier claim until those decisions are approved.

The local Xcode readiness path must keep:

- `script/check_xcode_readiness.sh` as the explicit heavy Xcode build check.
- The committed `AMGDecoderApp-iOS` and `AMGDecoderApp-macOS` schemes as the native app targets.
- macOS, iPhone simulator, and iPad simulator destination coverage when matching simulator runtimes are installed.
- No signing team, provisioning profile, App Store archive, or final distribution bundle identifier claim until those decisions are approved.

Run `npm test` after changing the Xcode project or readiness scripts so `scripts/test_xcode_project_contract.mjs` and `scripts/test_xcode_readiness_contract.mjs` can catch contract drift. Run `npm run test:xcode` on machines with Xcode and matching simulator runtimes before treating the native app as Apple-platform build-ready.

## Simulator Smoke Contract

The simulator smoke path must keep:

- `script/check_simulator_smoke.sh` as the explicit heavy simulator install/launch check.
- The committed `AMGDecoderApp-iOS` scheme and local-only `app.amgdecoder.local.ios` bundle identifier.
- A build, install, launch, screenshot, and terminate flow using Xcode and `xcrun simctl`.
- Screenshot output under ignored `dist/simulator-smoke/` generated artifacts.
- No signing team, provisioning profile, App Store archive, or final distribution bundle identifier claim until those decisions are approved.

Run `npm test` after changing the simulator smoke script so `scripts/test_simulator_smoke_contract.mjs` can catch contract drift. Run `npm run test:simulator` on machines with Xcode and the configured simulator runtime before treating simulator launch as verified.

## Browser Regression

`npm test` also runs `scripts/test_browser_ui.mjs`, which starts a local static server, launches Playwright, checks the Martin, Taylor, PRS, Gibson, Fender, Epiphone, and Collings analyzer flows, runs axe-core against the initial page, verifies keyboard skip-link behavior, checks source visibility, and confirms no page-level horizontal overflow on desktop or mobile.

Set `KEEP_BROWSER_ARTIFACTS=1 npm run test:browser` to keep temporary screenshots for visual inspection.

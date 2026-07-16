# Apple Release Human Intake

This worksheet is the human-owned input needed before AMG Decoder can move from local Apple-platform validation to release asset, signing, privacy, App Store, and archive/export work.

Do not use this file as approval by itself. Approved values still need to be applied to `data/apple-release-metadata-intake.json` and `data/apple-final-asset-acceptance.json` in a dedicated release metadata pass.

## Current Gate

- Current status: blocked pending product/release decisions.
- Local validation may continue with local-only bundle identifiers and ignored `dist/` artifacts.
- Final app icons, launch artwork, App Store screenshots, `PrivacyInfo.xcprivacy`, signing settings, archive export options, production bundle identifiers, and App Store metadata must not be added until the required values below are supplied and reviewed.

## Identity

Required before creating production bundle identifiers or an App Store record.

| Field | Required input | Notes |
| --- | --- | --- |
| `approved_display_name` | Final App Store display name | Confirm exact capitalization and spacing. |
| `production_bundle_id_ios` | Production iOS/iPadOS bundle identifier | Must be owned by the Apple Developer account. |
| `production_bundle_id_macos` | Production macOS bundle identifier | May match iOS family only if the release owner approves that strategy. |
| `app_store_sku` | App Store SKU | Internal App Store Connect identifier. |
| `copyright_holder` | Legal copyright holder | Use the entity/person approved for public store metadata. |

## Signing

Required before archive or distribution builds.

| Field | Required input | Notes |
| --- | --- | --- |
| `apple_developer_team_id` | Apple Developer Team ID | Do not infer from local Xcode accounts. |
| `provisioning_strategy` | Automatic or manual provisioning decision | Include profile ownership if manual. |
| `distribution_certificate_policy` | Certificate ownership and rotation policy | Identify who maintains distribution certificates. |
| `entitlements_and_capabilities` | Approved capabilities list | Explicitly say `none` if no extra capabilities are approved. |

## Privacy

Required before privacy manifests or App Store privacy answers.

| Field | Required input | Notes |
| --- | --- | --- |
| `privacy_policy_url` | Public Privacy Policy URL | Must be reachable before App Store submission. |
| `app_store_privacy_answers` | App Store privacy nutrition answers | Review against the final app and dependency surface. |
| `required_reason_api_review` | Required-reason API assessment | Identify any APIs that require reasons or state `none reviewed`. |
| `privacy_manifest_decision` | Whether to add `PrivacyInfo.xcprivacy` | Include the approved manifest contents if required. |
| `third_party_sdk_privacy_review` | SDK privacy review outcome | Include SDK privacy manifests or state no third-party SDK data collection. |

## Final Assets

Required before app icon, launch asset, or screenshot generation.

| Field | Required input | Notes |
| --- | --- | --- |
| `app_icon_source_artwork` | Approved product-owned source artwork | Provide source file path/location and ownership approval. |
| `app_icon_review_owner` | Named reviewer/approver | Person or role accountable for final icon approval. |
| `launch_asset_decision` | Default SwiftUI launch or approved launch artwork | Include platform-specific decisions for iPhone, iPad, and macOS. |
| `app_store_screenshot_policy` | Screenshot capture and copy policy | Must require real app UI and descriptive-only analyzer claims. |

## Store Listing

Required before App Store submission.

| Field | Required input | Notes |
| --- | --- | --- |
| `subtitle` | Approved subtitle | Must not overclaim authentication, valuation, ownership, warranty, or unsupported coverage. |
| `description` | Approved description | Keep claims descriptive and source-backed. |
| `keywords` | Approved keyword list | Confirm App Store locale strategy. |
| `support_url` | Public support URL | Must be reachable before submission. |
| `age_rating` | Age rating answers | Must match App Store Connect questionnaire responses. |
| `content_rights` | Content rights declaration | Confirm rights for app text, screenshots, icons, and included references. |

## Archive And Export

Required before archive/export workflows.

| Field | Required input | Notes |
| --- | --- | --- |
| `distribution_channel` | App Store, TestFlight, Developer ID, or other channel | Include whether macOS distribution is App Store, notarized direct, or both. |
| `archive_scheme_policy` | Which schemes are archive targets | Confirm iOS/iPadOS and macOS scope. |
| `export_method` | Xcode export method | Example categories include app-store, development, developer-id, or ad-hoc, depending on channel. |
| `export_options_owner` | Owner of export options | Identifies who approves `ExportOptions.plist` contents. |
| `mac_notarization_decision` | macOS notarization decision | Required for non-App Store macOS distribution. |

## After Approval

1. Update `data/apple-release-metadata-intake.json` with approved non-null values and reviewed statuses.
2. Update `data/apple-final-asset-acceptance.json` only after artwork, launch, and screenshot decisions are approved.
3. Run `npm run dry-run:release:metadata` and confirm only approved areas report ready for a dedicated apply pass.
4. Run `npm run test:release:intake`, `npm run test:release:assets`, and `npm run test:release:readiness`.
5. Apply signing, privacy, final asset, App Store metadata, and archive/export changes in a separate reviewed pass.

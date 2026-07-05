import XCTest
@testable import AnalyzerCore

final class AnalyzerCoreTests: XCTestCase {
    private var bundle: AnalyzerBundle!

    override func setUpWithError() throws {
        bundle = try AnalyzerBundle()
    }

    func testMartinFixtureParity() throws {
        try assertFixtures("martin_standard_guitars_ukuleles", brand: .martin)
    }

    func testTaylorFixtureParity() throws {
        try assertFixtures("taylor_serial_rules", brand: .taylor)
    }

    func testPRSFixtureParity() throws {
        try assertFixtures("prs_set_neck_rules", brand: .prs)
    }

    func testGibsonFixtureParity() throws {
        try assertFixtures("gibson_serial_rules", brand: .gibson)
    }

    func testFenderFixtureParity() throws {
        try assertFixtures("fender_us_serial_rules", brand: .fender)
    }

    func testEpiphoneFixtureParity() throws {
        try assertFixtures("epiphone_serial_rules", brand: .epiphone)
    }

    func testCollingsFixtureParity() throws {
        try assertFixtures("collings_serial_rules", brand: .collings)
    }

    func testRegistrySourcesResolveForImplementedBrands() throws {
        for brand in BrandID.allCases {
            let result = bundle.analyze(brand: brand, serial: sampleSerial(for: brand))
            XCTAssertNotEqual(result.confidence, .unsupported, brand.rawValue)
            XCTAssertFalse(result.sources.isEmpty, brand.rawValue)
            XCTAssertFalse(result.sources[0].url.isEmpty, brand.rawValue)
            XCTAssertFalse(result.sources[0].sourceTier.isEmpty, brand.rawValue)
        }
    }

    func testActiveBrandManifestMatchesNativeSurface() throws {
        let manifest = bundle.activeBrandManifest
        let manifestIDs = manifest.activeBrands.map(\.id)
        let nativeIDs = BrandID.allCases.map(\.rawValue)

        XCTAssertEqual(manifest.schemaVersion, 1)
        XCTAssertEqual(manifest.productName, "AMG Decoder")
        XCTAssertEqual(manifestIDs, nativeIDs)
        XCTAssertEqual(Set(manifest.excludedBrands.map(\.id)), ["suhr", "novo"])

        for brand in BrandID.allCases {
            let manifestBrand = try XCTUnwrap(manifest.activeBrands.first { $0.id == brand.rawValue })
            XCTAssertEqual(manifestBrand, manifest.activeBrand(for: brand))
            XCTAssertFalse(manifestBrand.displayName.isEmpty)
            XCTAssertFalse(manifestBrand.status.isEmpty)
            XCTAssertEqual(manifestBrand.surface, "analyzer")
        }
    }

    private func assertFixtures(_ fixtureName: String, brand: BrandID) throws {
        let fixtures = try AnalyzerBundle.fixtureFile(fixtureName)
        XCTAssertFalse(fixtures.cases.isEmpty, fixtureName)

        for testCase in fixtures.cases {
            let serial = try XCTUnwrap(testCase.input["serial"], testCase.id)
            let result = bundle.analyze(brand: brand, serial: serial)

            XCTAssertEqual(result.confidence, testCase.expected.confidence, testCase.id)
            XCTAssertEqual(result.matchedRule.id, testCase.expected.matchedRule, testCase.id)
            XCTAssertEqual(result.decoded, testCase.expected.decoded, testCase.id)
            XCTAssertFalse(result.sources.isEmpty, testCase.id)
            if let sourceID = testCase.expected.sourceID {
                XCTAssertEqual(result.sources[0].id, sourceID, testCase.id)
            }
        }
    }

    private func sampleSerial(for brand: BrandID) -> String {
        switch brand {
        case .martin:
            "2935987"
        case .taylor:
            "1107064001"
        case .prs:
            "24375043"
        case .gibson:
            "91418009"
        case .fender:
            "US17123456"
        case .epiphone:
            "EE04091234"
        case .collings:
            "I35LC232197"
        }
    }
}

import XCTest
import UIKit

final class AMGDecoderUITests: XCTestCase {
    override func setUp() {
        continueAfterFailure = false
    }

    func testCompactIPhoneNavigationAnalyzerFlow() throws {
        guard UIDevice.current.userInterfaceIdiom == .phone else {
            throw XCTSkip("Compact iPhone navigation assertions require an iPhone simulator.")
        }

        let app = XCUIApplication()
        app.launch()

        assertExists(app.staticTexts["AMG Decoder"], timeout: 10)
        assertExists(identifier("brand-sidebar", in: app))
        XCTAssertFalse(app.textFields["serial-input"].firstMatch.exists, "Compact iPhone should start on the brand list.")
        XCTAssertEqual(identifier("brand-row-suhr", in: app).exists, false)
        XCTAssertEqual(identifier("brand-row-novo", in: app).exists, false)

        selectCompactBrand("fender", named: "Fender", in: app)

        let serialInput = app.textFields["serial-input"].firstMatch
        assertExists(serialInput)
        assertExists(app.staticTexts["Fender serial analyzer"])
        assertExists(app.staticTexts["Official source"])
        serialInput.tap()
        serialInput.typeText("MX17123456")

        let analyze = app.buttons["form-analyze-button"].firstMatch
        assertExists(analyze)
        analyze.tap()

        assertExists(identifier("analyzer-result", in: app))
        assertExists(app.staticTexts["Production range 2017-2018"])
        assertExists(app.staticTexts["MEDIUM confidence"])
        assertExists(app.staticTexts["Mexican-made Fender instrument"])
        assertAnyExists(
            [
                app.links["How can I find out when my Mexican-made instrument was manufactured?"],
                app.buttons["How can I find out when my Mexican-made instrument was manufactured?"],
                app.staticTexts["How can I find out when my Mexican-made instrument was manufactured?"]
            ]
        )

        let footer = identifier("product-boundary-footer", in: app)
        if !footer.waitForExistence(timeout: 2) {
            app.scrollViews.firstMatch.swipeUp()
        }
        assertExists(footer)
        assertExists(app.staticTexts["Serial results do not establish authenticity, model identity, or value."])
    }

    func testMartinAnalyzerAccessibleFlow() {
        let app = XCUIApplication()
        app.launch()

        assertExists(app.staticTexts["AMG Decoder"], timeout: 10)
        assertExists(identifier("brand-sidebar", in: app))

        let serialInput = app.textFields["serial-input"].firstMatch
        if !serialInput.waitForExistence(timeout: 2) {
            let martin = app.buttons["Martin, Implemented, Martin, Implemented"].firstMatch
            assertExists(martin)
            martin.tap()
        }
        assertExists(serialInput)
        serialInput.tap()
        serialInput.typeText("2935987")

        let analyze = app.buttons["form-analyze-button"].firstMatch
        assertExists(analyze)
        analyze.tap()

        assertExists(identifier("analyzer-result", in: app))
        assertExists(app.staticTexts["Production year 2024"])
        assertExists(app.staticTexts["HIGH confidence"])
        assertExists(app.staticTexts["Source"])
        assertAnyExists(
            [
                app.links["C. F. Martin & Co. Serial/Date Lookup"],
                app.buttons["C. F. Martin & Co. Serial/Date Lookup"],
                app.staticTexts["C. F. Martin & Co. Serial/Date Lookup"]
            ]
        )

        let footer = identifier("product-boundary-footer", in: app)
        if !footer.waitForExistence(timeout: 2) {
            app.scrollViews.firstMatch.swipeUp()
        }
        assertExists(footer)
        assertExists(app.staticTexts["Serial results do not establish authenticity, model identity, or value."])
    }

    func testFenderMexicoAnalyzerAccessibleFlow() {
        let app = XCUIApplication()
        app.launch()

        assertExists(app.staticTexts["AMG Decoder"], timeout: 10)
        assertExists(identifier("brand-sidebar", in: app))
        selectBrand("fender", in: app)

        let serialInput = app.textFields["serial-input"].firstMatch
        assertExists(serialInput)
        serialInput.tap()
        serialInput.typeText("MX17123456")

        let analyze = app.buttons["form-analyze-button"].firstMatch
        assertExists(analyze)
        analyze.tap()

        assertExists(identifier("analyzer-result", in: app))
        assertExists(app.staticTexts["Production range 2017-2018"])
        assertExists(app.staticTexts["MEDIUM confidence"])
        assertExists(app.staticTexts["Country scope"])
        assertExists(app.staticTexts["Mexican-made Fender instrument"])
        assertExists(app.staticTexts["Matched rule"])
        assertExists(app.staticTexts["fender.mx_2010_2017.mx_prefix"])
        assertExists(app.staticTexts["Source"])
        assertAnyExists(
            [
                app.links["How can I find out when my Mexican-made instrument was manufactured?"],
                app.buttons["How can I find out when my Mexican-made instrument was manufactured?"],
                app.staticTexts["How can I find out when my Mexican-made instrument was manufactured?"]
            ]
        )

        let footer = identifier("product-boundary-footer", in: app)
        if !footer.waitForExistence(timeout: 2) {
            app.scrollViews.firstMatch.swipeUp()
        }
        assertExists(footer)
        assertExists(app.staticTexts["Serial results do not establish authenticity, model identity, or value."])
    }

    func testFenderJapanContextGuidanceFlow() {
        let app = XCUIApplication()
        app.launch()

        assertExists(app.staticTexts["AMG Decoder"], timeout: 10)
        assertExists(identifier("brand-sidebar", in: app))
        selectBrand("fender", in: app)

        let serialInput = app.textFields["serial-input"].firstMatch
        assertExists(serialInput)
        serialInput.tap()
        serialInput.typeText("JD12123456")

        let analyze = app.buttons["form-analyze-button"].firstMatch
        assertExists(analyze)
        analyze.tap()

        assertExists(identifier("analyzer-result", in: app))
        assertExists(app.staticTexts["Fender Japan JD-prefix context required"])
        assertExists(app.staticTexts["UNSUPPORTED confidence"])
        assertExists(app.staticTexts["Required context"])
        assertExists(app.staticTexts["Confirm Made in Japan decal and 2012 transition-period context before dating."])
        assertExists(app.staticTexts["Matched rule"])
        assertExists(app.staticTexts["fender.jp_2012_present.jd_context_required"])
        assertExists(app.staticTexts["Source"])
        assertAnyExists(
            [
                app.links["How can I find out when my Japanese-made instrument was manufactured?"],
                app.buttons["How can I find out when my Japanese-made instrument was manufactured?"],
                app.staticTexts["How can I find out when my Japanese-made instrument was manufactured?"]
            ]
        )

        XCTAssertFalse(app.staticTexts["Production year 2012"].exists)
        assertExists(app.staticTexts["Serial results do not establish authenticity, model identity, or value."])
    }

    private func selectBrand(_ brand: String, in app: XCUIApplication) {
        let brandIdentifier = "brand-row-\(brand)"
        let brandRow = identifier(brandIdentifier, in: app)
        if brandRow.waitForExistence(timeout: 2) {
            brandRow.tap()
            return
        }
        let matchingButton = app.buttons.matching(NSPredicate(format: "identifier == %@ OR label CONTAINS[c] %@", brandIdentifier, brand)).firstMatch
        assertExists(matchingButton)
        matchingButton.tap()
    }

    private func selectCompactBrand(_ brand: String, named brandName: String, in app: XCUIApplication) {
        let brandLink = identifier("brand-link-\(brand)", in: app)
        let brandRow = identifier("brand-row-\(brand)", in: app)
        let brandLabel = app.staticTexts[brandName].firstMatch
        let list = app.collectionViews.firstMatch
        for _ in 0..<5 where !brandLink.exists && !brandRow.exists && !brandLabel.exists {
            list.swipeUp()
        }

        if brandLink.waitForExistence(timeout: 2) {
            brandLink.tap()
            return
        }
        if brandRow.exists {
            brandRow.tap()
            return
        }
        assertExists(brandLabel)
        brandLabel.tap()
    }

    private func identifier(_ value: String, in app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: value).firstMatch
    }

    private func assertExists(
        _ element: XCUIElement,
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertTrue(element.waitForExistence(timeout: timeout), file: file, line: line)
    }

    private func assertAnyExists(
        _ elements: [XCUIElement],
        timeout: TimeInterval = 5,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if elements.contains(where: { $0.exists }) {
                return
            }
            RunLoop.current.run(until: Date().addingTimeInterval(0.1))
        }
        XCTAssertTrue(elements.contains(where: { $0.exists }), file: file, line: line)
    }
}

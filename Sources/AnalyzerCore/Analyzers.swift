import Foundation

private let invalidWarning = "Serial is required and must contain digits only."
private let taylorInvalidWarning = "Taylor serial is required and must be digits only or the documented 4-prefix format."
private let prsInvalidWarning = "PRS set-neck or S2 serial is required for this scoped rule."
private let gibsonInvalidWarning = "Gibson serial is required and must match a scoped official Gibson guitar format."
private let fenderInvalidWarning = "Fender serial is required and must match a scoped U.S.-made, Mexican-made, or Indonesian-made Fender instrument format."
private let epiphoneInvalidWarning = "Epiphone serial is required and must match a Gibson-documented Epiphone guitar format."
private let collingsInvalidWarning = "Collings serial is required and must match the scoped official electric format or 3-5 digit acoustic records-assisted format."

extension AnalyzerBundle {
    func analyzeMartin(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines)
        let source = sourceOrFallback(id: martin.sourceID)
        let baseInput: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": serial.allSatisfy(\.isNumber) && !serial.isEmpty ? .string(serial) : .null
        ]
        guard !serial.isEmpty, serial.allSatisfy(\.isNumber), let serialNumber = Int(serial) else {
            return result(brand: martin.brand, input: baseInput, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [invalidWarning], source: source)
        }
        if let quarantine = martin.quarantines.first(where: { serialNumber >= $0.rangeStart && serialNumber <= $0.rangeEnd }) {
            let warning = "Official Martin lookup excludes serials 900001 through 902908 from the 2002 guitar/ukulele range because they were used on Sigma-Martins in 1981-1982."
            return result(brand: martin.brand, input: baseInput, confidence: .unsupported, rule: quarantine.id, label: "Sigma-Martin quarantine", decoded: [:], warnings: [warning], source: source)
        }
        var previousLast = 0
        for row in martin.ranges {
            if serialNumber <= row.lastSerial {
                return result(
                    brand: martin.brand,
                    input: baseInput,
                    confidence: martin.lookupRule.confidence,
                    rule: martin.ruleID,
                    label: martin.label,
                    decoded: [
                        "production_year": .int(row.year),
                        "range_start": .int(previousLast + 1),
                        "range_end": .int(row.lastSerial)
                    ],
                    warnings: Array(martin.warnings.prefix(2)),
                    source: source
                )
            }
            previousLast = row.lastSerial
        }
        return result(brand: martin.brand, input: baseInput, confidence: .unsupported, rule: martin.ruleID, label: martin.label, decoded: [:], warnings: ["Serial is above the current official Martin guitar/ukulele table reviewed on \(martin.lastReviewed)."], source: source)
    }

    func analyzeTaylor(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines)
        let source = sourceOrFallback(id: taylor.sourceID)
        let baseInput: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": serial.isEmpty ? .null : .string(serial)
        ]
        guard !serial.isEmpty else {
            return result(brand: taylor.brand, input: baseInput, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [taylorInvalidWarning], source: source)
        }
        if let match = serial.wholeMatch(of: /4-(\d{3,4})/) {
            return analyzeTaylorFourPrefix(serial: serial, sequence: Int(match.1) ?? 0, input: baseInput, source: source)
        }
        guard serial.allSatisfy(\.isNumber) else {
            return result(brand: taylor.brand, input: baseInput, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [taylorInvalidWarning], source: source)
        }
        switch serial.count {
        case 10:
            return analyzeTaylorCurrent(serial: serial, input: baseInput, source: source)
        case 9:
            return analyzeTaylorNine(serial: serial, input: baseInput, source: source)
        case 11:
            return analyzeTaylorEleven(serial: serial, input: baseInput, source: source)
        default:
            return analyzeTaylorRange(serial: serial, input: baseInput, source: source)
        }
    }

    func analyzePRS(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines)
        let source = sourceOrFallback(id: prs.sourceID)
        let baseInput: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": serial.allSatisfy(\.isNumber) && !serial.isEmpty ? .string(serial) : .null,
            "scope": .string(prs.implementedScope)
        ]
        guard !serial.isEmpty else {
            return result(brand: prs.brand, input: baseInput, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [prsInvalidWarning, prs.warnings[1]], source: source)
        }
        if let match = serial.wholeMatch(of: /(?i)S2(\d+)/) {
            return analyzePRSS2(serial: serial, digits: String(match.1), input: baseInput, source: source)
        }
        guard serial.allSatisfy(\.isNumber) else {
            return result(brand: prs.brand, input: baseInput, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [prsInvalidWarning, prs.warnings[1]], source: source)
        }
        return analyzePRSSetNeck(serial: serial, input: baseInput, source: source)
    }

    func analyzeGibson(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let compact = serial.replacingOccurrences(of: " ", with: "")
        let source = sourceOrFallback(id: gibson.sourceID)
        let input: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": compact.isEmpty ? .null : .string(compact),
            "scope": .string(gibson.implementedScope)
        ]
        guard !serial.isEmpty else {
            return result(brand: gibson.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [gibsonInvalidWarning, gibson.warnings[0]], source: source)
        }
        if serial.wholeMatch(of: /[A-Z]{2,}\s?\d+/) != nil, !serial.hasPrefix("CS") {
            return result(brand: gibson.brand, input: input, confidence: .unsupported, rule: "gibson.signature.excluded", label: "Gibson artist signature format excluded", decoded: [:], warnings: ["Gibson states artist signature models often deviate from standard serial formats and should be checked with Gibson.", gibson.warnings[0]], source: source)
        }
        if compact.wholeMatch(of: /94\d{6}/) != nil {
            return gibsonResult("gibson.centennial_1994.94rrrrrr", input: input, confidence: .high, decoded: ["production_year": .int(1994), "production_number": .int(Int(String(compact.dropFirst(2))) ?? 0)], source: source)
        }
        if let match = compact.wholeMatch(of: /CS(\d)(\d{3,4})/) {
            let sequence = Int(String(match.2)) ?? 0
            guard sequence > 0 else { return invalidGibson(input: input, warning: "Custom Shop sequence must be greater than zero.", source: source) }
            return gibsonResult("gibson.custom_shop.modern_csyrrrr", input: input, confidence: .medium, decoded: ["production_year_digit": .int(Int(String(match.1)) ?? 0), "sequence": .int(sequence)], source: source)
        }
        if let match = compact.wholeMatch(of: /([0456789])(\d)(\d{3,4})/) {
            let modelCode = String(match.1)
            let sequence = Int(String(match.3)) ?? 0
            guard sequence > 0 else { return invalidGibson(input: input, warning: "Reissue sequence must be greater than zero.", source: source) }
            let modelYear = modelCode == "0" ? 1960 : 1950 + (Int(modelCode) ?? 0)
            return gibsonResult("gibson.custom_shop.reissue.myrrrr", input: input, confidence: .medium, decoded: ["model_year": .int(modelYear), "model_hint": .string(gibson.modelYearCodes[modelCode] ?? ""), "production_year_digit": .int(Int(String(match.2)) ?? 0), "sequence": .int(sequence)], source: source)
        }
        if let match = compact.wholeMatch(of: /A([89])(\d)(\d{4})/) {
            let code = "A\(match.1)"
            let sequence = Int(String(match.3)) ?? 0
            guard sequence > 0 else { return invalidGibson(input: input, warning: "ES label sequence must be greater than zero.", source: source) }
            return gibsonResult("gibson.custom_shop.es_label.a8_a9", input: input, confidence: .medium, decoded: ["model_hint": .string(gibson.esLabelCodes[code] ?? ""), "production_year_digit": .int(Int(String(match.2)) ?? 0), "sequence": .int(sequence)], source: source)
        }
        if compact.wholeMatch(of: /\d{9}/) != nil {
            let chars = Array(compact)
            let modelYear = Int(String(chars[0...1])) ?? -1
            if modelYear >= 14, modelYear <= 18 {
                return gibsonResult("gibson.usa_2014_mid_2019.yyrrrrrrr", input: input, confidence: .medium, decoded: ["production_year": .int(2000 + modelYear), "production_number": .int(Int(String(chars[2...8])) ?? 0)], source: source)
            }
            let year = productionYear(twoDigit: String([chars[0], chars[4]]))
            let day = Int(String(chars[1...3])) ?? 0
            let rank = Int(String(chars[6...8])) ?? 0
            guard validDay(year: year, day: day), rank > 0 else { return invalidGibson(input: input, warning: "Gibson 9-digit date format contains an invalid day or rank.", source: source) }
            return gibsonResult("gibson.usa_2005_2014_2019_present.ydddybrrr", input: input, confidence: .high, decoded: ["production_year": .int(year), "day_of_year": .int(day), "batch": .int(Int(String(chars[5])) ?? 0), "rank": .int(rank)], source: source)
        }
        if compact.wholeMatch(of: /\d{8}/) != nil {
            let chars = Array(compact)
            let year = productionYear(twoDigit: String([chars[0], chars[4]]))
            let day = Int(String(chars[1...3])) ?? 0
            let rank = Int(String(chars[5...7])) ?? 0
            guard validDay(year: year, day: day), rank > 0 else { return invalidGibson(input: input, warning: "Gibson 8-digit date format contains an invalid day or rank.", source: source) }
            return gibsonResult("gibson.usa_1977_2005.ydddyrrr", input: input, confidence: .high, decoded: ["production_year": .int(year), "day_of_year": .int(day), "rank": .int(rank)], source: source)
        }
        return invalidGibson(input: input, warning: gibsonInvalidWarning, source: source)
    }

    func analyzeFender(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let source = sourceOrFallback(id: fender.sourceID)
        let input: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": serial.isEmpty ? .null : .string(serial),
            "scope": .string(fender.implementedScope)
        ]
        guard !serial.isEmpty else {
            return result(brand: fender.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [fenderInvalidWarning, fender.warnings[0]], source: source)
        }
        if let match = serial.wholeMatch(of: /V(\d{4,6})/) {
            return fenderResult("fender.us_vintage_series.v_prefix", input: input, confidence: .low, decoded: ["production_year_range": .string("1982-present"), "series_hint": .string("U.S. Vintage Series or American Vintage candidate"), "sequence": .int(Int(String(match.1)) ?? 0), "required_context": .string("neck heel production date")], source: source)
        }
        if let match = serial.wholeMatch(of: /US(\d{2})(\d{6})/) {
            let year = 2000 + (Int(String(match.1)) ?? 0)
            guard year >= 2010, year <= 2026 else { return invalidFender(input: input, warning: "US-prefix year is outside the reviewed Fender range.", source: source) }
            return fenderResult("fender.us_2010_present.us_prefix", input: input, confidence: .high, decoded: ["production_year": .int(year), "prefix": .string("US\(match.1)"), "unit_identifier": .int(Int(String(match.2)) ?? 0)], source: source)
        }
        if let match = serial.wholeMatch(of: /10\s(\d{7})/) {
            return fenderResult("fender.us_late_2009_2010.ten_prefix", input: input, confidence: .medium, decoded: ["production_year_range": .string("late 2009-March 2010"), "sequence": .int(Int(String(match.1)) ?? 0)], source: source)
        }
        if let match = serial.wholeMatch(of: /(D?Z)(\d)(\d{5,6})/) {
            let prefix = "\(match.1)\(match.2)"
            let hint = String(match.1) == "DZ" ? "American Deluxe" : "U.S.-made Fender"
            return fenderResult("fender.us_2000_2009.z_dz_prefixes", input: input, confidence: .medium, decoded: ["production_year_range": .string(String(2000 + (Int(String(match.2)) ?? 0))), "prefix": .string(prefix), "series_hint": .string(hint), "sequence": .int(Int(String(match.3)) ?? 0)], source: source)
        }
        if let match = serial.wholeMatch(of: /(M[NSZ]\d)(\d{5,6})/) {
            let prefix = String(match.1)
            guard !prefix.hasPrefix("MS") else {
                return invalidFender(input: input, warning: "Mexico artist-model exception prefixes require a separate scoped flow.", source: source)
            }
            if let range = fenderRule("fender.mx_1990_2009.mn_mz_prefixes").prefixYearRanges?[prefix] {
                return fenderResult("fender.mx_1990_2009.mn_mz_prefixes", input: input, confidence: .medium, decoded: ["production_year_range": .string(range), "prefix": .string(prefix), "country_scope": .string("Mexican-made Fender instrument"), "sequence": .int(Int(String(match.2)) ?? 0)])
            }
        }
        if let match = serial.wholeMatch(of: /(MX\d{2})(\d{6})/) {
            let prefix = String(match.1)
            if let range = fenderRule("fender.mx_2010_2017.mx_prefix").prefixYearRanges?[prefix] {
                return fenderResult("fender.mx_2010_2017.mx_prefix", input: input, confidence: .medium, decoded: ["production_year_range": .string(range), "prefix": .string(prefix), "country_scope": .string("Mexican-made Fender instrument"), "unit_identifier": .int(Int(String(match.2)) ?? 0)])
            }
            return invalidFender(input: input, warning: "MX-prefix year is outside the reviewed Fender Mexico range.", source: source)
        }
        if let match = serial.wholeMatch(of: /(ICF?\d{2})(\d{6})/) {
            let prefix = String(match.1)
            if let range = fenderRule("fender.id_2008_2012.ic_icf_prefixes").prefixYearRanges?[prefix] {
                return fenderResult("fender.id_2008_2012.ic_icf_prefixes", input: input, confidence: .medium, decoded: ["production_year_range": .string(range), "prefix": .string(prefix), "country_scope": .string("Indonesian-made Fender instrument"), "factory_scope": .string("Cort factory"), "unit_identifier": .int(Int(String(match.2)) ?? 0)])
            }
            return invalidFender(input: input, warning: "IC/ICF-prefix year is outside the reviewed Fender Indonesia range.", source: source)
        }
        if let match = serial.wholeMatch(of: /JD(\d{2})(\d{6})/) {
            return fenderResult("fender.jp_2012_present.jd_context_required", input: input, confidence: .unsupported, decoded: ["prefix": .string("JD\(match.1)"), "serial_location": .string("Made in Japan serial number decal"), "required_context": .string("Confirm Made in Japan decal and 2012 transition-period context before dating.")])
        }
        if let match = serial.wholeMatch(of: /([SEN]\d)(\d{5,6})/) {
            let prefix = String(match.1)
            if let range = fenderRule("fender.us_1976_1999.s_e_n_prefixes").prefixYearRanges?[prefix] {
                return fenderResult("fender.us_1976_1999.s_e_n_prefixes", input: input, confidence: .medium, decoded: ["production_year_range": .string(range), "prefix": .string(prefix), "sequence": .int(Int(String(match.2)) ?? 0)], source: source)
            }
        }
        let earlyRule = fenderRule("fender.us_1950_1976.serial_ranges")
        let rangeInput: (String, Int)?
        if let match = serial.wholeMatch(of: /L(\d{5})/) {
            rangeInput = ("l_prefix", Int(String(match.1)) ?? -1)
        } else if serial.wholeMatch(of: /\d{1,6}/) != nil {
            rangeInput = ("numeric", Int(serial) ?? -1)
        } else {
            rangeInput = nil
        }
        if let (pattern, number) = rangeInput,
           let range = earlyRule.ranges?.first(where: { $0.pattern == pattern && number >= $0.rangeStart && number <= $0.rangeEnd }) {
            return fenderResult("fender.us_1950_1976.serial_ranges", input: input, confidence: .medium, decoded: ["production_year_range": .string(range.yearRange), "range_start": .int(range.rangeStart), "range_end": .int(range.rangeEnd)], source: source)
        }
        return invalidFender(input: input, warning: fenderInvalidWarning, source: source)
    }

    func analyzeEpiphone(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let source = sourceOrFallback(id: epiphone.sourceID)
        let input: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": serial.isEmpty ? .null : .string(serial),
            "scope": .string(epiphone.implementedScope)
        ]
        guard !serial.isEmpty else {
            return invalidEpiphone(input: input, warning: epiphoneInvalidWarning, source: source)
        }
        if let match = serial.wholeMatch(of: /([A-Z]{1,2})(\d{2})(\d{1,2})(\d{4})/) {
            let month = Int(String(match.3)) ?? 0
            guard month >= 1, month <= 12 else { return invalidEpiphone(input: input, warning: "Epiphone serial contains an invalid production month.", source: source) }
            return epiphoneResult("epiphone.regular_production.pre_2008.factory_yymm_rank", input: input, decoded: ["production_year": .int(productionYear(twoDigit: String(match.2))), "production_month": .int(month), "factory_code": .string(String(match.1)), "rank": .int(Int(String(match.4)) ?? 0)], source: source)
        }
        if let match = serial.wholeMatch(of: /([A-Z])(\d)(\d{4})/) {
            return epiphoneResult("epiphone.elite_elitist.fyssss", input: input, decoded: ["production_year": .int(2000 + (Int(String(match.2)) ?? 0)), "factory_code": .string(String(match.1)), "series_hint": .string("Elite or Elitist"), "sequence": .int(Int(String(match.3)) ?? 0)], source: source)
        }
        if let match = serial.wholeMatch(of: /(\d{2})(\d{2})(\d{6})/) {
            let month = Int(String(match.2)) ?? 0
            guard month >= 1, month <= 12 else { return invalidEpiphone(input: input, warning: "Epiphone numeric serial contains an invalid production month.", source: source) }
            return epiphoneResult("epiphone.numeric_2008_present.yymmrrrrrr", input: input, decoded: ["production_year": .int(productionYear(twoDigit: String(match.1))), "production_month": .int(month), "rank": .int(Int(String(match.3)) ?? 0)], source: source)
        }
        return invalidEpiphone(input: input, warning: epiphoneInvalidWarning, source: source)
    }

    func analyzeCollings(serial rawSerial: String) -> AnalyzerResult {
        let serial = rawSerial.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let normalized = serial.replacingOccurrences(of: #"[\s-]"#, with: "", options: .regularExpression)
        let source = sourceOrFallback(id: collings.sourceID)
        let input: [String: JSONValue] = [
            "serial": .string(serial),
            "normalized_serial": normalized.isEmpty ? .null : .string(normalized),
            "scope": .string(collings.implementedScope)
        ]
        guard !normalized.isEmpty else {
            return invalidCollings(input: input, warning: collingsInvalidWarning, source: source)
        }
        let sortedPrefixes = collings.electricPrefixes.sorted { $0.count > $1.count }
        for prefix in sortedPrefixes where normalized.hasPrefix(prefix) {
            let remainder = String(normalized.dropFirst(prefix.count))
            guard let match = remainder.wholeMatch(of: /(\d{2})(\d+)/) else { continue }
            let year = 2000 + (Int(String(match.1)) ?? 0)
            let sequence = Int(String(match.2)) ?? 0
            guard year >= 2000, year <= 2026, sequence > 0 else {
                return invalidCollings(input: input, warning: "Collings electric year or sequence is outside the reviewed official format.", source: source)
            }
            return collingsResult("collings.electric.prefix_yy_sequence", input: input, confidence: .high, decoded: ["production_year": .int(year), "model_hint": .string(prefix), "sequence": .int(sequence)], source: source)
        }
        if normalized.wholeMatch(of: /\d{3,5}/) != nil {
            let rule = collingsRule("collings.acoustic.records_assisted")
            return result(brand: collings.brand, input: input, confidence: .unsupported, rule: rule.id, label: rule.label, decoded: ["serial_location": .string("Neck block"), "required_context": .string("Contact Collings with the serial number for exact acoustic ship-date records.")], warnings: [collings.warnings[2], collings.warnings[3]], source: source)
        }
        return invalidCollings(input: input, warning: collingsInvalidWarning, source: source)
    }
}

private extension AnalyzerBundle {
    func analyzeTaylorCurrent(serial: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = taylorRule("taylor.current_10_digit.2009_present")
        guard let factory = rule.factoryCodes?[String(serial.first!)] else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Factory code is not documented for Taylor's current 10-digit format.", source: source)
        }
        let chars = Array(serial)
        let year = 2000 + Int(String([chars[1], chars[6]]))!
        guard let date = isoDate(year: year, month: Int(String(chars[2...3]))!, day: Int(String(chars[4...5]))!) else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial contains an invalid calendar date.", source: source)
        }
        if date < rule.startDate! {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial date is before Taylor's documented current 10-digit format start.", source: source)
        }
        let sequence = Int(String(chars[7...9]))!
        guard sequence > 0 else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Production sequence must be greater than zero.", source: source)
        }
        return result(brand: taylor.brand, input: input, confidence: .high, rule: rule.id, label: rule.label, decoded: ["factory": .string(factory), "start_date": .string(date), "sequence": .int(sequence)], warnings: [taylor.warnings[0]], source: source)
    }

    func analyzeTaylorNine(serial: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = taylorRule("taylor.nine_digit.1993_1999")
        let chars = Array(serial)
        let year = 1900 + Int(String(chars[0...1]))!
        guard year >= rule.yearStart!, year <= rule.yearEnd! else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial year is outside Taylor's documented 1993-1999 9-digit format.", source: source)
        }
        guard let date = isoDate(year: year, month: Int(String(chars[2...3]))!, day: Int(String(chars[4...5]))!) else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial contains an invalid calendar date.", source: source)
        }
        let seriesCode = String(chars[6])
        guard let series = taylor.seriesCodes[seriesCode] else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Series code is not documented for this Taylor serial format.", source: source)
        }
        let sequence = Int(String(chars[7...8]))!
        guard sequence > 0 else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Production sequence must be greater than zero.", source: source)
        }
        return result(brand: taylor.brand, input: input, confidence: .high, rule: rule.id, label: rule.label, decoded: ["start_date": .string(date), "series": .string(series), "series_code": .string(seriesCode), "sequence": .int(sequence)], warnings: [taylor.warnings[0], taylor.warnings[1]], source: source)
    }

    func analyzeTaylorEleven(serial: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = taylorRule("taylor.eleven_digit.2000_2009")
        let chars = Array(serial)
        let year = Int(String(chars[0...3]))!
        guard let date = isoDate(year: year, month: Int(String(chars[4...5]))!, day: Int(String(chars[6...7]))!) else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial contains an invalid calendar date.", source: source)
        }
        guard date >= rule.startDate!, date <= rule.endDate! else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Serial date is outside Taylor's documented 2000 through October 2009 11-digit format.", source: source)
        }
        let seriesCode = String(chars[8])
        guard let series = taylor.seriesCodes[seriesCode] else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Series code is not documented for this Taylor serial format.", source: source)
        }
        let sequence = Int(String(chars[9...10]))!
        guard sequence > 0 else {
            return unsupportedTaylor(rule: rule, input: input, warning: "Production sequence must be greater than zero.", source: source)
        }
        return result(brand: taylor.brand, input: input, confidence: .high, rule: rule.id, label: rule.label, decoded: ["start_date": .string(date), "series": .string(series), "series_code": .string(seriesCode), "sequence": .int(sequence)], warnings: [taylor.warnings[0], taylor.warnings[1]], source: source)
    }

    func analyzeTaylorFourPrefix(serial: String, sequence: Int, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = taylorRule("taylor.four_prefix_410.1991_1992")
        guard let range = rule.ranges?.first(where: { sequence >= $0.rangeStart && sequence <= $0.rangeEnd }) else {
            return unsupportedTaylor(rule: rule, input: input, warning: "4-prefix serial is outside Taylor's documented 1991-1992 410 ranges.", source: source)
        }
        return result(brand: taylor.brand, input: input, confidence: .high, rule: rule.id, label: rule.label, decoded: ["production_year": .int(range.year), "sequence": .int(sequence)], warnings: [taylor.warnings[0]], source: source)
    }

    func analyzeTaylorRange(serial: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = taylorRule("taylor.pre_1993_ranges")
        let number = Int(serial) ?? -1
        if let range = rule.ranges?.first(where: { number >= $0.rangeStart && number <= $0.rangeEnd }) {
            return result(brand: taylor.brand, input: input, confidence: .medium, rule: rule.id, label: rule.label, decoded: ["production_year": .int(range.year), "range_start": .int(range.rangeStart), "range_end": .int(range.rangeEnd)], warnings: [taylor.warnings[0], taylor.warnings[2]], source: source)
        }
        return unsupportedTaylor(rule: rule, input: input, warning: "Serial does not match a Taylor format currently encoded from the official source.", source: source)
    }

    func analyzePRSSetNeck(serial: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = prsRule("prs.set_neck.approximate_ranges")
        for quarantine in rule.quarantines ?? [] {
            if let year = quarantine.year,
               let prefix = prs.prefixYears.first(where: { $0.value.contains(year) })?.key,
               serial.hasPrefix(prefix) {
                return unsupportedPRS(ruleID: quarantine.id, label: "PRS set-neck quarantined authority row", input: input, warning: quarantine.reason, source: source)
            }
        }
        let prefixes = prs.prefixYears.keys.filter { serial.hasPrefix($0) }.sorted { $0.count > $1.count }
        for prefix in prefixes {
            let sequenceText = String(serial.dropFirst(prefix.count))
            guard let sequence = Int(sequenceText), !sequenceText.isEmpty else { continue }
            let allowedYears = prs.prefixYears[prefix] ?? []
            if let range = rule.ranges.first(where: { allowedYears.contains($0.year) && sequence >= $0.rangeStart && sequence <= $0.rangeEnd }) {
                return result(brand: prs.brand, input: input, confidence: .high, rule: rule.id, label: rule.label, decoded: ["production_year": .int(range.year), "prefix": .string(prefix), "sequence": .int(sequence), "range_start": .int(range.rangeStart), "range_end": .int(range.rangeEnd), "serial_location": .string(rule.serialLocation)], warnings: prs.warnings, source: source)
            }
        }
        return unsupportedPRS(ruleID: rule.id, label: rule.label, input: input, warning: "Serial does not match the encoded PRS set-neck prefix and sequence ranges.", source: source)
    }

    func analyzePRSS2(serial: String, digits: String, input: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = prsRule("prs.s2.approximate_ranges")
        let normalized = "S2\(digits)"
        if let quarantine = rule.quarantines?.first(where: { $0.serial == normalized }) {
            return unsupportedPRS(ruleID: quarantine.id, label: "PRS S2 quarantined authority row", input: input, warning: quarantine.reason, source: source)
        }
        let number = Int(String(normalized.dropFirst())) ?? -1
        if let range = rule.ranges.first(where: { number >= $0.rangeStart && number <= $0.rangeEnd }) {
            var nextInput = input
            nextInput["normalized_serial"] = .string(normalized)
            return result(brand: prs.brand, input: nextInput, confidence: .high, rule: rule.id, label: rule.label, decoded: ["production_year": .int(range.year), "family": .string("S2"), "serial_number": .string(normalized), "range_start": .string("S\(range.rangeStart)"), "range_end": .string("S\(range.rangeEnd)"), "serial_location": .string(rule.serialLocation)], warnings: prs.warnings, source: source)
        }
        return unsupportedPRS(ruleID: rule.id, label: rule.label, input: input, warning: "Serial does not match the encoded PRS S2 sequence ranges.", source: source)
    }

    func result(brand: String, input: [String: JSONValue], confidence: Confidence, rule: String, label: String, decoded: [String: JSONValue], warnings: [String], source: AnalyzerSource) -> AnalyzerResult {
        AnalyzerResult(brand: brand, input: input, confidence: confidence, matchedRule: MatchedRule(id: rule, label: label), decoded: decoded, warnings: warnings, sources: [source])
    }

    func unsupportedTaylor(rule: TaylorRule, input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: taylor.brand, input: input, confidence: .unsupported, rule: rule.id, label: rule.label, decoded: [:], warnings: [warning, taylor.warnings[0]], source: source)
    }

    func unsupportedPRS(ruleID: String, label: String, input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: prs.brand, input: input, confidence: .unsupported, rule: ruleID, label: label, decoded: [:], warnings: [warning, prs.warnings[1], prs.warnings[2]], source: source)
    }

    func taylorRule(_ id: String) -> TaylorRule {
        guard let rule = taylor.rules.first(where: { $0.id == id }) else { fatalError("Missing Taylor rule \(id)") }
        return rule
    }

    func prsRule(_ id: String) -> PRSRule {
        guard let rule = prs.rules.first(where: { $0.id == id }) else { fatalError("Missing PRS rule \(id)") }
        return rule
    }

    func gibsonRule(_ id: String) -> SimpleRule {
        guard let rule = gibson.rules.first(where: { $0.id == id }) else { fatalError("Missing Gibson rule \(id)") }
        return rule
    }

    func fenderRule(_ id: String) -> FenderRule {
        guard let rule = fender.rules.first(where: { $0.id == id }) else { fatalError("Missing Fender rule \(id)") }
        return rule
    }

    func epiphoneRule(_ id: String) -> SimpleRule {
        guard let rule = epiphone.rules.first(where: { $0.id == id }) else { fatalError("Missing Epiphone rule \(id)") }
        return rule
    }

    func collingsRule(_ id: String) -> SimpleRule {
        guard let rule = collings.rules.first(where: { $0.id == id }) else { fatalError("Missing Collings rule \(id)") }
        return rule
    }

    func gibsonResult(_ ruleID: String, input: [String: JSONValue], confidence: Confidence, decoded: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = gibsonRule(ruleID)
        return result(brand: gibson.brand, input: input, confidence: confidence, rule: rule.id, label: rule.label, decoded: decoded, warnings: gibson.warnings, source: source)
    }

    func fenderResult(_ ruleID: String, input: [String: JSONValue], confidence: Confidence, decoded: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = fenderRule(ruleID)
        let ruleSource = rule.sourceID.map(sourceOrFallback(id:)) ?? source
        return result(brand: fender.brand, input: input, confidence: confidence, rule: rule.id, label: rule.label, decoded: decoded, warnings: fender.warnings, source: ruleSource)
    }

    func fenderResult(_ ruleID: String, input: [String: JSONValue], confidence: Confidence, decoded: [String: JSONValue]) -> AnalyzerResult {
        let rule = fenderRule(ruleID)
        let source = sourceOrFallback(id: rule.sourceID ?? fender.sourceID)
        return result(brand: fender.brand, input: input, confidence: confidence, rule: rule.id, label: rule.label, decoded: decoded, warnings: fender.warnings, source: source)
    }

    func invalidGibson(input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: gibson.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [warning, gibson.warnings[0]], source: source)
    }

    func invalidFender(input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: fender.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [warning, fender.warnings[0]], source: source)
    }

    func epiphoneResult(_ ruleID: String, input: [String: JSONValue], decoded: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = epiphoneRule(ruleID)
        return result(brand: epiphone.brand, input: input, confidence: rule.confidence ?? .medium, rule: rule.id, label: rule.label, decoded: decoded, warnings: epiphone.warnings, source: source)
    }

    func invalidEpiphone(input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: epiphone.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [warning, epiphone.warnings[0]], source: source)
    }

    func collingsResult(_ ruleID: String, input: [String: JSONValue], confidence: Confidence, decoded: [String: JSONValue], source: AnalyzerSource) -> AnalyzerResult {
        let rule = collingsRule(ruleID)
        return result(brand: collings.brand, input: input, confidence: confidence, rule: rule.id, label: rule.label, decoded: decoded, warnings: [collings.warnings[0], collings.warnings[1], collings.warnings[3]], source: source)
    }

    func invalidCollings(input: [String: JSONValue], warning: String, source: AnalyzerSource) -> AnalyzerResult {
        result(brand: collings.brand, input: input, confidence: .unsupported, rule: "input.invalid_serial", label: "Invalid serial input", decoded: [:], warnings: [warning, collings.warnings[3]], source: source)
    }

    func productionYear(twoDigit: String) -> Int {
        let yy = Int(twoDigit) ?? 0
        return yy <= 26 ? 2000 + yy : 1900 + yy
    }

    func validDay(year: Int, day: Int) -> Bool {
        let leap = Calendar(identifier: .gregorian).range(of: .day, in: .year, for: isoDateObject(year: year))?.count == 366
        return day >= 1 && day <= (leap ? 366 : 365)
    }

    func isoDateObject(year: Int) -> Date {
        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.timeZone = TimeZone(secondsFromGMT: 0)
        components.year = year
        components.month = 1
        components.day = 1
        return components.date!
    }

    func sourceOrFallback(id: String) -> AnalyzerSource {
        (try? source(id: id)) ?? AnalyzerSource(id: id, name: "Unknown source", url: "", sourceTier: "unverified")
    }

    func isoDate(year: Int, month: Int, day: Int) -> String? {
        var components = DateComponents()
        components.calendar = Calendar(identifier: .gregorian)
        components.timeZone = TimeZone(secondsFromGMT: 0)
        components.year = year
        components.month = month
        components.day = day
        guard let date = components.date else { return nil }
        let resolved = components.calendar!.dateComponents(in: components.timeZone!, from: date)
        guard resolved.year == year, resolved.month == month, resolved.day == day else { return nil }
        return "\(year)-\(String(format: "%02d", month))-\(String(format: "%02d", day))"
    }
}

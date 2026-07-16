import Foundation

struct SourceRegistry: Decodable {
    let sources: [RegistrySource]
}

struct RegistrySource: Decodable {
    let id: String
    let name: String
    let url: String
    let sourceTier: String

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case url
        case sourceTier = "source_tier"
    }

    var analyzerSource: AnalyzerSource {
        AnalyzerSource(id: id, name: name, url: url, sourceTier: sourceTier)
    }
}

struct MartinData: Decodable {
    let brand: String
    let ruleID: String
    let label: String
    let sourceID: String
    let lastReviewed: String
    let lookupRule: LookupRule
    let quarantines: [RangeQuarantine]
    let warnings: [String]
    let ranges: [YearLastRange]

    enum CodingKeys: String, CodingKey {
        case brand
        case ruleID = "rule_id"
        case label
        case sourceID = "source_id"
        case lastReviewed = "last_reviewed"
        case lookupRule = "lookup_rule"
        case quarantines
        case warnings
        case ranges
    }
}

struct LookupRule: Decodable {
    let confidence: Confidence
}

struct RangeQuarantine: Decodable {
    let id: String
    let rangeStart: Int
    let rangeEnd: Int
    let reason: String

    enum CodingKeys: String, CodingKey {
        case id
        case rangeStart = "range_start"
        case rangeEnd = "range_end"
        case reason
    }
}

struct YearLastRange: Decodable {
    let year: Int
    let lastSerial: Int

    enum CodingKeys: String, CodingKey {
        case year
        case lastSerial = "last_serial"
    }
}

struct TaylorData: Decodable {
    let brand: String
    let sourceID: String
    let lastReviewed: String
    let rules: [TaylorRule]
    let seriesCodes: [String: String]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case lastReviewed = "last_reviewed"
        case rules
        case seriesCodes = "series_codes"
        case warnings
    }
}

struct TaylorRule: Decodable {
    let id: String
    let label: String
    let startDate: String?
    let endDate: String?
    let yearStart: Int?
    let yearEnd: Int?
    let factoryCodes: [String: String]?
    let ranges: [YearRange]?

    enum CodingKeys: String, CodingKey {
        case id
        case label
        case startDate = "start_date"
        case endDate = "end_date"
        case yearStart = "year_start"
        case yearEnd = "year_end"
        case factoryCodes = "factory_codes"
        case ranges
    }
}

struct YearRange: Decodable {
    let year: Int
    let rangeStart: Int
    let rangeEnd: Int

    enum CodingKeys: String, CodingKey {
        case year
        case rangeStart = "range_start"
        case rangeEnd = "range_end"
    }
}

struct PRSData: Decodable {
    let brand: String
    let sourceID: String
    let implementedScope: String
    let prefixYears: [String: [Int]]
    let rules: [PRSRule]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case implementedScope = "implemented_scope"
        case prefixYears = "prefix_years"
        case rules
        case warnings
    }
}

struct PRSRule: Decodable {
    let id: String
    let label: String
    let serialLocation: String
    let ranges: [YearRange]
    let quarantines: [PRSQuarantine]?

    enum CodingKeys: String, CodingKey {
        case id
        case label
        case serialLocation = "serial_location"
        case ranges
        case quarantines
    }
}

struct PRSQuarantine: Decodable {
    let id: String
    let year: Int?
    let serial: String?
    let reason: String
}

struct GibsonData: Decodable {
    let brand: String
    let sourceID: String
    let implementedScope: String
    let modelYearCodes: [String: String]
    let esLabelCodes: [String: String]
    let rules: [SimpleRule]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case implementedScope = "implemented_scope"
        case modelYearCodes = "model_year_codes"
        case esLabelCodes = "es_label_codes"
        case rules
        case warnings
    }
}

struct FenderData: Decodable {
    let brand: String
    let sourceID: String
    let implementedScope: String
    let rules: [FenderRule]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case implementedScope = "implemented_scope"
        case rules
        case warnings
    }
}

struct EpiphoneData: Decodable {
    let brand: String
    let sourceID: String
    let implementedScope: String
    let rules: [SimpleRule]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case implementedScope = "implemented_scope"
        case rules
        case warnings
    }
}

struct CollingsData: Decodable {
    let brand: String
    let sourceID: String
    let implementedScope: String
    let electricPrefixes: [String]
    let rules: [SimpleRule]
    let warnings: [String]

    enum CodingKeys: String, CodingKey {
        case brand
        case sourceID = "source_id"
        case implementedScope = "implemented_scope"
        case electricPrefixes = "electric_prefixes"
        case rules
        case warnings
    }
}

struct SimpleRule: Decodable {
    let id: String
    let label: String
    let confidence: Confidence?
}

struct FenderRule: Decodable {
    let id: String
    let sourceID: String?
    let label: String
    let confidence: Confidence
    let ranges: [FenderRange]?
    let prefixYearRanges: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id
        case sourceID = "source_id"
        case label
        case confidence
        case ranges
        case prefixYearRanges = "prefix_year_ranges"
    }
}

struct FenderRange: Decodable {
    let pattern: String
    let rangeStart: Int
    let rangeEnd: Int
    let yearRange: String

    enum CodingKeys: String, CodingKey {
        case pattern
        case rangeStart = "range_start"
        case rangeEnd = "range_end"
        case yearRange = "year_range"
    }
}

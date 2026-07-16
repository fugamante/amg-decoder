import Foundation

public enum Confidence: String, Codable, Equatable, CaseIterable, Sendable {
    case high
    case medium
    case low
    case unsupported
}

public struct AnalyzerSource: Codable, Equatable, Sendable {
    public let id: String
    public let name: String
    public let url: String
    public let sourceTier: String

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case url
        case sourceTier = "source_tier"
    }
}

public struct MatchedRule: Codable, Equatable, Sendable {
    public let id: String
    public let label: String
}

public enum JSONValue: Codable, Equatable, Sendable, CustomStringConvertible {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Int.self) {
            self = .int(value)
        } else if let value = try? container.decode(Double.self) {
            self = .double(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    public var description: String {
        switch self {
        case .string(let value): value
        case .int(let value): String(value)
        case .double(let value): String(value)
        case .bool(let value): String(value)
        case .object(let value): String(describing: value)
        case .array(let value): value.map(\.description).joined(separator: ", ")
        case .null: ""
        }
    }
}

public struct AnalyzerResult: Codable, Equatable, Sendable {
    public let brand: String
    public let input: [String: JSONValue]
    public let confidence: Confidence
    public let matchedRule: MatchedRule
    public let decoded: [String: JSONValue]
    public let warnings: [String]
    public let sources: [AnalyzerSource]

    enum CodingKeys: String, CodingKey {
        case brand
        case input
        case confidence
        case matchedRule = "matched_rule"
        case decoded
        case warnings
        case sources
    }
}

public struct FixtureCase: Decodable {
    public struct Expected: Decodable {
        public let confidence: Confidence
        public let matchedRule: String
        public let sourceID: String?
        public let decoded: [String: JSONValue]

        enum CodingKeys: String, CodingKey {
            case confidence
            case matchedRule = "matched_rule"
            case sourceID = "source_id"
            case decoded
        }
    }

    public let id: String
    public let input: [String: String]
    public let expected: Expected
}

public struct FixtureFile: Decodable {
    public let cases: [FixtureCase]
}

public struct ActiveBrandManifest: Decodable, Equatable, Sendable {
    public let schemaVersion: Int
    public let productName: String
    public let activeBrands: [ManifestBrand]
    public let excludedBrands: [ManifestBrandExclusion]

    enum CodingKeys: String, CodingKey {
        case schemaVersion = "schema_version"
        case productName = "product_name"
        case activeBrands = "active_brands"
        case excludedBrands = "excluded_brands"
    }

    public func activeBrand(for brand: BrandID) -> ManifestBrand? {
        activeBrands.first { $0.id == brand.rawValue }
    }
}

public struct ManifestBrand: Decodable, Equatable, Sendable {
    public let id: String
    public let displayName: String
    public let status: String
    public let dataPath: String
    public let surface: String

    public init(id: String, displayName: String, status: String, dataPath: String, surface: String) {
        self.id = id
        self.displayName = displayName
        self.status = status
        self.dataPath = dataPath
        self.surface = surface
    }

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case status
        case dataPath = "data_path"
        case surface
    }
}

public struct ManifestBrandExclusion: Decodable, Equatable, Sendable {
    public let id: String
    public let displayName: String
    public let status: String
    public let reason: String

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case status
        case reason
    }
}

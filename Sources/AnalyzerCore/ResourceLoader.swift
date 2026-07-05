import Foundation

public enum AnalyzerError: Error, LocalizedError {
    case missingResource(String)
    case missingSource(String)
    case missingRule(String)

    public var errorDescription: String? {
        switch self {
        case .missingResource(let path): "Missing bundled resource: \(path)"
        case .missingSource(let id): "Missing source registry entry: \(id)"
        case .missingRule(let id): "Missing analyzer rule: \(id)"
        }
    }
}

public struct AnalyzerBundle {
    public let activeBrandManifest: ActiveBrandManifest
    let registry: SourceRegistry
    let martin: MartinData
    let taylor: TaylorData
    let prs: PRSData
    let gibson: GibsonData
    let fender: FenderData
    let epiphone: EpiphoneData
    let collings: CollingsData

    public init() throws {
        try self.init(bundle: .module)
    }

    init(bundle: Bundle) throws {
        activeBrandManifest = try Self.decode("Data/active-brands", from: bundle)
        registry = try Self.decode("Data/source-registry", from: bundle)
        martin = try Self.decode("Data/martin-ranges", from: bundle)
        taylor = try Self.decode("Data/taylor-rules", from: bundle)
        prs = try Self.decode("Data/prs-rules", from: bundle)
        gibson = try Self.decode("Data/gibson-rules", from: bundle)
        fender = try Self.decode("Data/fender-rules", from: bundle)
        epiphone = try Self.decode("Data/epiphone-rules", from: bundle)
        collings = try Self.decode("Data/collings-rules", from: bundle)
    }

    public func source(id: String) throws -> AnalyzerSource {
        guard let source = registry.sources.first(where: { $0.id == id }) else {
            throw AnalyzerError.missingSource(id)
        }
        return source.analyzerSource
    }

    public func analyze(brand: BrandID, serial: String) -> AnalyzerResult {
        switch brand {
        case .martin:
            analyzeMartin(serial: serial)
        case .taylor:
            analyzeTaylor(serial: serial)
        case .prs:
            analyzePRS(serial: serial)
        case .gibson:
            analyzeGibson(serial: serial)
        case .fender:
            analyzeFender(serial: serial)
        case .epiphone:
            analyzeEpiphone(serial: serial)
        case .collings:
            analyzeCollings(serial: serial)
        }
    }

    static func decode<T: Decodable>(_ resource: String, from bundle: Bundle) throws -> T {
        let resourceURL = bundle.url(forResource: resource, withExtension: "json")
        let flattenedURL = bundle.url(forResource: URL(fileURLWithPath: resource).lastPathComponent, withExtension: "json")
        guard let url = resourceURL ?? flattenedURL else {
            throw AnalyzerError.missingResource(resource)
        }
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    static func fixtureFile(_ name: String) throws -> FixtureFile {
        try decode("Data/fixtures/\(name)", from: .module)
    }
}

public enum BrandID: String, CaseIterable, Identifiable, Sendable {
    case martin
    case taylor
    case prs
    case gibson
    case fender
    case epiphone
    case collings

    public var id: String { rawValue }
}

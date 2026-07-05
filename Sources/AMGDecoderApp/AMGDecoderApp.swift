import AnalyzerCore
import SwiftUI

@main
struct AMGDecoderApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                #if os(macOS)
                .frame(minWidth: 900, minHeight: 640)
                #endif
        }
    }
}

struct ContentView: View {
    @State private var bundleState: BundleState = .loading
    @State private var selectedBrand: BrandID = .martin
    @State private var serial = ""
    @State private var result: AnalyzerResult?

    var body: some View {
        Group {
            switch bundleState {
            case .loading:
                ProgressView("Loading source-backed rules")
            case .failed(let message):
                ContentUnavailableView("Analyzer data unavailable", systemImage: "exclamationmark.triangle", description: Text(message))
            case .ready(let bundle):
                AnalyzerShell(bundle: bundle, selectedBrand: $selectedBrand, serial: $serial, result: $result)
            }
        }
        .task {
            guard case .loading = bundleState else { return }
            do {
                bundleState = .ready(try AnalyzerBundle())
            } catch {
                bundleState = .failed(error.localizedDescription)
            }
        }
    }
}

enum BundleState {
    case loading
    case ready(AnalyzerBundle)
    case failed(String)
}

struct AnalyzerShell: View {
    let bundle: AnalyzerBundle
    @Binding var selectedBrand: BrandID
    @Binding var serial: String
    @Binding var result: AnalyzerResult?
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @FocusState private var serialFieldFocused: Bool
    @State private var compactPath: [AnalyzerRoute] = []

    var body: some View {
        if horizontalSizeClass == .compact {
            compactBody
        } else {
            splitBody
        }
    }

    private var compactBody: some View {
        NavigationStack(path: $compactPath) {
            CompactBrandList(
                manifest: bundle.activeBrandManifest,
                selectedBrand: selectedBrand,
                select: { brand in
                    if selectedBrand != brand {
                        selectedBrand = brand
                        clear()
                    }
                    compactPath = [.brand(brand)]
                }
            )
            .navigationTitle("AMG Decoder")
            .navigationDestination(for: AnalyzerRoute.self) { route in
                switch route {
                case .brand(let brand):
                    AnalyzerDetail(
                        brand: brand,
                        manifest: bundle.activeBrandManifest,
                        serial: $serial,
                        result: $result,
                        serialFieldFocused: $serialFieldFocused,
                        analyze: { analyze(brand: brand) },
                        clear: clear
                    )
                }
            }
            .accessibilityIdentifier("brand-sidebar")
        }
    }

    private var splitBody: some View {
        NavigationSplitView {
            BrandList(
                manifest: bundle.activeBrandManifest,
                selectedBrand: selectedBrand,
                select: { brand in
                    selectedBrand = brand
                }
            )
            .navigationTitle("AMG Decoder")
            .accessibilityIdentifier("brand-sidebar")
            #if os(macOS)
            .navigationSplitViewColumnWidth(min: 160, ideal: 176, max: 196)
            #else
            .navigationSplitViewColumnWidth(min: 220, ideal: 238, max: 260)
            #endif
            .onChange(of: selectedBrand) { _, _ in
                clear()
            }
        } detail: {
            AnalyzerDetail(
                brand: selectedBrand,
                manifest: bundle.activeBrandManifest,
                serial: $serial,
                result: $result,
                serialFieldFocused: $serialFieldFocused,
                analyze: { analyze(brand: selectedBrand) },
                clear: clear
            )
        }
    }

    private func analyze(brand: BrandID) {
        result = bundle.analyze(brand: brand, serial: serial)
    }

    private func clear() {
        serial = ""
        result = nil
        serialFieldFocused = true
    }
}

enum AnalyzerRoute: Hashable {
    case brand(BrandID)
}

struct CompactBrandList: View {
    let manifest: ActiveBrandManifest
    let selectedBrand: BrandID
    let select: (BrandID) -> Void

    var body: some View {
        List {
            Section("Implemented") {
                ForEach(BrandID.allCases) { brand in
                    let metadata = manifest.activeBrand(for: brand) ?? ManifestBrand.fallback(for: brand)
                    Button {
                        select(brand)
                    } label: {
                        BrandRow(brand: brand, metadata: metadata, isSelected: brand == selectedBrand)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("brand-link-\(brand.rawValue)")
                    .accessibilityHint("Opens the \(metadata.displayName) serial analyzer")
                }
            }
        }
    }
}

struct BrandList: View {
    let manifest: ActiveBrandManifest
    let selectedBrand: BrandID
    let select: (BrandID) -> Void

    var body: some View {
        List {
            Section("Implemented") {
                ForEach(BrandID.allCases) { brand in
                    let metadata = manifest.activeBrand(for: brand) ?? ManifestBrand.fallback(for: brand)
                    Button {
                        select(brand)
                    } label: {
                        BrandRow(brand: brand, metadata: metadata, isSelected: brand == selectedBrand)
                    }
                    .buttonStyle(.plain)
                    .accessibilityHint("Selects the \(metadata.displayName) serial analyzer")
                }
            }
        }
    }
}

struct AnalyzerDetail: View {
    let brand: BrandID
    let manifest: ActiveBrandManifest
    @Binding var serial: String
    @Binding var result: AnalyzerResult?
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    var serialFieldFocused: FocusState<Bool>.Binding
    let analyze: () -> Void
    let clear: () -> Void

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                balancedRegularBody
            } else {
                compactDetailBody
            }
        }
        .navigationTitle(metadata.displayName)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button(action: clear) {
                    Label("Clear", systemImage: "xmark.circle")
                }
                .disabled(serial.isEmpty && result == nil)
                .accessibilityIdentifier("clear-serial-button")

                Button(action: analyze) {
                    Label("Analyze", systemImage: "magnifyingglass")
                }
                .disabled(serial.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                .keyboardShortcut(.return, modifiers: .command)
                .accessibilityIdentifier("analyze-serial-button")
            }
        }
        .accessibilityIdentifier("analyzer-detail")
    }

    private var compactDetailBody: some View {
        ScrollView {
            detailContent(footerPlacement: .inline)
            .padding()
            .frame(maxWidth: 980, alignment: .leading)
        }
    }

    private var balancedRegularBody: some View {
        GeometryReader { proxy in
            ScrollView {
                detailContent(footerPlacement: .bottom)
                    .padding(.horizontal, 24)
                    .padding(.top, max(28, proxy.size.height * 0.055))
                    .padding(.bottom, 28)
                    .frame(maxWidth: 980, alignment: .leading)
                    .frame(minHeight: proxy.size.height, alignment: .top)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
    }

    @ViewBuilder
    private func detailContent(footerPlacement: FooterPlacement) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            AnalyzerHeader(brand: brand)
            AnalyzerForm(
                brand: brand,
                serial: $serial,
                serialFieldFocused: serialFieldFocused,
                analyze: analyze
            )
            if let result {
                ResultView(result: result)
            } else {
                EmptyResultView(metadata: metadata)
            }
            ScopeStrip(brand: brand)
            if footerPlacement == .bottom {
                Spacer(minLength: 28)
            }
            FooterView()
        }
    }

    private enum FooterPlacement {
        case inline
        case bottom
    }

    private var metadata: ManifestBrand {
        manifest.activeBrand(for: brand) ?? ManifestBrand.fallback(for: brand)
    }
}

struct BrandRow: View {
    let brand: BrandID
    let metadata: ManifestBrand?
    let isSelected: Bool

    var body: some View {
        let metadata = metadata ?? ManifestBrand.fallback(for: brand)
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(metadata.displayName)
                    .font(.headline)
                Text(metadata.status)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: isSelected ? "checkmark.seal.fill" : "checkmark.seal")
                .foregroundStyle(isSelected ? Color.accentColor : Color.green)
        }
        .accessibilityIdentifier("brand-row-\(brand.rawValue)")
        .accessibilityLabel("\(metadata.displayName), \(metadata.status)")
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

struct AnalyzerHeader: View {
    let brand: BrandID

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.largeTitle.bold())
                    .lineLimit(nil)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer()
                Label("Official source", systemImage: "waveform.path.ecg")
                    .font(.callout)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.regularMaterial, in: Capsule())
            }
            Text(subtitle)
                .font(.title3)
                .foregroundStyle(.secondary)
                .lineLimit(nil)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(subtitle). Official source-backed analyzer.")
        .accessibilitySortPriority(3)
    }

    var title: String {
        switch brand {
        case .martin: "Martin serial analyzer"
        case .taylor: "Taylor serial analyzer"
        case .prs: "PRS serial analyzer"
        case .gibson: "Gibson serial analyzer"
        case .fender: "Fender serial analyzer"
        case .epiphone: "Epiphone serial analyzer"
        case .collings: "Collings serial analyzer"
        }
    }

    var subtitle: String {
        switch brand {
        case .martin: "Standard guitar and ukulele production-year lookup."
        case .taylor: "Official 10, 9, 11, 4-prefix, and pre-1993 serial rules."
        case .prs: "Official PRS set-neck and S2 approximate sequence ranges."
        case .gibson: "Official Gibson guitar serial formats with Custom Shop scope warnings."
        case .fender: "Official U.S.-made, Mexican-made, and Indonesian-made Fender ranges, plus Japan context guidance."
        case .epiphone: "Gibson-documented Epiphone guitar serial formats."
        case .collings: "Official Collings electric serial parsing plus acoustic lookup guidance."
        }
    }
}

struct AnalyzerForm: View {
    let brand: BrandID
    @Binding var serial: String
    var serialFieldFocused: FocusState<Bool>.Binding
    let analyze: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Serial number")
                .font(.headline)
                .accessibilityIdentifier("serial-form")
            ViewThatFits(in: .horizontal) {
                HStack {
                    serialField
                    analyzeButton
                }
                VStack(alignment: .leading, spacing: 12) {
                    serialField
                    analyzeButton
                }
            }
            Text(help)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(nil)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
            ViewThatFits(in: .horizontal) {
                HStack {
                    sampleButtons
                }
                VStack(alignment: .leading, spacing: 8) {
                    sampleButtons
                }
            }
        }
        .padding()
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(brandDisplayName) serial analyzer form")
        .accessibilitySortPriority(2)
    }

    private var serialField: some View {
        TextField("Enter serial number", text: $serial)
            .textFieldStyle(.roundedBorder)
            .submitLabel(.done)
            .focused(serialFieldFocused)
            .onSubmit(analyze)
            .autocorrectionDisabled()
            .accessibilityLabel("\(brandDisplayName) serial number")
            .accessibilityHint(help)
            .accessibilityIdentifier("serial-input")
    }

    private var analyzeButton: some View {
        Button(action: analyze) {
            Label("Analyze", systemImage: "magnifyingglass")
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .disabled(serial.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .accessibilityHint("Runs source-backed \(brandDisplayName) serial analysis")
        .accessibilityIdentifier("form-analyze-button")
    }

    @ViewBuilder
    private var sampleButtons: some View {
        ForEach(samples, id: \.label) { sample in
            Button {
                serial = sample.serial
                analyze()
            } label: {
                Text(sample.label)
            }
            .buttonStyle(.bordered)
            .accessibilityLabel(sample.accessibility)
            .accessibilityIdentifier("sample-serial-\(sample.serial)")
        }
    }

    var help: String {
        switch brand {
        case .martin: "Digits only for Martin standard guitar and ukulele lookup."
        case .taylor: "Digits only, except Taylor's documented 4-prefix format such as 4-1121."
        case .prs: "Digits for set-neck serials, or S2-prefix serials, located on the back of the headstock."
        case .gibson: "Gibson USA, Acoustic, Memphis, Custom Shop, Les Paul Classic, or documented reissue serials."
        case .fender: "Scoped U.S.-made, Mexican-made, Indonesian-made, or Japan JD-context Fender serials from official Fender dating pages."
        case .epiphone: "Epiphone regular production, Elite/Elitist, or all-numeric serials documented by Gibson."
        case .collings: "Collings electric serials such as I35LC232197, or 3-5 digit acoustic serials for contact guidance."
        }
    }

    var brandDisplayName: String {
        switch brand {
        case .martin: "Martin"
        case .taylor: "Taylor"
        case .prs: "PRS"
        case .gibson: "Gibson"
        case .fender: "Fender"
        case .epiphone: "Epiphone"
        case .collings: "Collings"
        }
    }

    var samples: [SampleSerial] {
        switch brand {
        case .martin:
            [
                SampleSerial(label: "Supported", serial: "2935987", accessibility: "Use supported Martin sample serial 2935987"),
                SampleSerial(label: "Quarantine", serial: "900001", accessibility: "Use Sigma Martin quarantine sample serial 900001"),
                SampleSerial(label: "Above table", serial: "3043481", accessibility: "Use above table Martin sample serial 3043481")
            ]
        case .taylor:
            [
                SampleSerial(label: "10-digit", serial: "1107064001", accessibility: "Use Taylor 10 digit sample serial 1107064001"),
                SampleSerial(label: "9-digit", serial: "980311301", accessibility: "Use Taylor 9 digit sample serial 980311301"),
                SampleSerial(label: "4-prefix", serial: "4-1121", accessibility: "Use Taylor 4 prefix sample serial 4 dash 1121")
            ]
        case .prs:
            [
                SampleSerial(label: "Set-neck", serial: "24375043", accessibility: "Use PRS set neck 2024 sample serial 24375043"),
                SampleSerial(label: "S2", serial: "S2071820", accessibility: "Use PRS S2 2024 sample serial S2071820"),
                SampleSerial(label: "2023 hold", serial: "2335906", accessibility: "Use PRS set neck 2023 quarantined sample serial 2335906")
            ]
        case .gibson:
            [
                SampleSerial(label: "USA 8-digit", serial: "91418009", accessibility: "Use Gibson USA 8 digit sample serial 91418009"),
                SampleSerial(label: "USA 9-digit", serial: "000450002", accessibility: "Use Gibson USA 9 digit sample serial 000450002"),
                SampleSerial(label: "Custom CS", serial: "CS10845", accessibility: "Use Gibson Custom Shop CS sample serial CS10845")
            ]
        case .fender:
            [
                SampleSerial(label: "US-prefix", serial: "US17123456", accessibility: "Use Fender US prefix sample serial US17123456"),
                SampleSerial(label: "MX-prefix", serial: "MX17123456", accessibility: "Use Fender Mexico MX prefix sample serial MX17123456"),
                SampleSerial(label: "IC/ICF", serial: "ICF10123456", accessibility: "Use Fender Indonesia ICF prefix sample serial ICF10123456"),
                SampleSerial(label: "Japan JD", serial: "JD12123456", accessibility: "Use Fender Japan JD context sample serial JD12123456"),
                SampleSerial(label: "MN/MZ", serial: "MZ8123456", accessibility: "Use Fender Mexico MZ prefix sample serial MZ8123456"),
                SampleSerial(label: "Z/DZ", serial: "DZ512345", accessibility: "Use Fender American Deluxe sample serial DZ512345"),
                SampleSerial(label: "Early range", serial: "L23456", accessibility: "Use Fender L prefix sample serial L23456"),
                SampleSerial(label: "V-prefix", serial: "V12345", accessibility: "Use Fender V prefix sample serial V12345")
            ]
        case .epiphone:
            [
                SampleSerial(label: "Pre-2008", serial: "EE04091234", accessibility: "Use Epiphone pre 2008 sample serial EE04091234"),
                SampleSerial(label: "Elite", serial: "T31234", accessibility: "Use Epiphone Elite or Elitist sample serial T31234"),
                SampleSerial(label: "Numeric", serial: "0809123456", accessibility: "Use Epiphone numeric sample serial 0809123456")
            ]
        case .collings:
            [
                SampleSerial(label: "I-35 LC", serial: "I35LC232197", accessibility: "Use Collings I35LC electric sample serial I35LC232197"),
                SampleSerial(label: "290", serial: "290181443", accessibility: "Use Collings 290 electric sample serial 290181443"),
                SampleSerial(label: "Acoustic", serial: "12345", accessibility: "Use Collings acoustic guidance sample serial 12345")
            ]
        }
    }
}

struct SampleSerial: Identifiable {
    var id: String { label }

    let label: String
    let serial: String
    let accessibility: String
}

struct EmptyResultView: View {
    let metadata: ManifestBrand

    var body: some View {
        ContentUnavailableView("Ready for a \(metadata.displayName) serial", systemImage: "plus", description: Text("Results use bundled official source-backed rules. Serial lookup is not authentication."))
            .frame(maxWidth: .infinity, minHeight: 180)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
            .accessibilityIdentifier("empty-result")
            .accessibilityLabel("Ready for a \(metadata.displayName) serial. Results use bundled official source-backed rules. Serial lookup is not authentication.")
            .accessibilitySortPriority(1)
    }
}

private extension ManifestBrand {
    static func fallback(for brand: BrandID) -> ManifestBrand {
        ManifestBrand(
            id: brand.rawValue,
            displayName: brand.rawValue.capitalized,
            status: "Unavailable",
            dataPath: "",
            surface: "analyzer"
        )
    }
}

struct ResultView: View {
    let result: AnalyzerResult

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: result.confidence == .unsupported ? "exclamationmark.triangle" : "checkmark")
                    .font(.headline)
                    .foregroundStyle(result.confidence == .unsupported ? .orange : .green)
                    .frame(width: 32, height: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(result.confidence.rawValue.uppercased() + " confidence")
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                    Text(heading)
                        .font(.title2.bold())
                        .lineLimit(nil)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(result.confidence == .unsupported ? Color.orange.opacity(0.12) : Color.green.opacity(0.12))

            ViewThatFits(in: .horizontal) {
                factGrid
                factList
            }
            .font(.body)
            .padding()
        }
        .background(.background, in: RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(.separator, lineWidth: 1)
        )
        .accessibilityIdentifier("analyzer-result")
        .accessibilityElement(children: .contain)
        .accessibilityLabel(resultAccessibilityLabel)
        .accessibilitySortPriority(1)
    }

    private var factRows: [(String, String)] {
        var rows = facts
        rows.append(("Matched rule", result.matchedRule.id))
        rows.append(("Warnings", result.warnings.joined(separator: " ")))
        if let source = result.sources.first {
            rows.append(("Source", source.name))
        }
        return rows
    }

    private var factGrid: some View {
        Grid(alignment: .leading, horizontalSpacing: 28, verticalSpacing: 14) {
            ForEach(factRows, id: \.0) { label, value in
                GridRow {
                    Text(label)
                        .foregroundStyle(.secondary)
                        .lineLimit(nil)
                        .fixedSize(horizontal: false, vertical: true)
                    if label == "Source", let source = result.sources.first, let url = URL(string: source.url) {
                        Link(source.name, destination: url)
                            .lineLimit(nil)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text(value)
                            .lineLimit(nil)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var factList: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(factRows, id: \.0) { label, value in
                VStack(alignment: .leading, spacing: 4) {
                    Text(label)
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                        .lineLimit(nil)
                        .fixedSize(horizontal: false, vertical: true)
                    if label == "Source", let source = result.sources.first, let url = URL(string: source.url) {
                        Link(source.name, destination: url)
                            .lineLimit(nil)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text(value)
                            .lineLimit(nil)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .textSelection(.enabled)
                    }
                }
            }
        }
    }

    var heading: String {
        if result.confidence == .unsupported {
            return result.matchedRule.label
        }
        if let year = result.decoded["production_year"]?.description, !year.isEmpty {
            return "Production year \(year)"
        }
        if let range = result.decoded["production_year_range"]?.description, !range.isEmpty {
            return "Production range \(range)"
        }
        if let date = result.decoded["start_date"]?.description, !date.isEmpty {
            return "Start date \(date)"
        }
        return "Supported serial"
    }

    var resultAccessibilityLabel: String {
        let sourceName = result.sources.first?.name ?? "source unavailable"
        let warnings = result.warnings.joined(separator: " ")
        return "\(result.confidence.rawValue.uppercased()) confidence. \(heading). Matched rule \(result.matchedRule.id). Source \(sourceName). \(warnings)"
    }

    var facts: [(String, String)] {
        let labels = [
            ("production_year", "Production year"),
            ("production_year_range", "Production range"),
            ("production_year_digit", "Production year digit"),
            ("start_date", "Start date"),
            ("day_of_year", "Day of year"),
            ("factory", "Factory"),
            ("factory_scope", "Factory scope"),
            ("factory_code", "Factory code"),
            ("country_scope", "Country scope"),
            ("production_month", "Production month"),
            ("model_year", "Model year"),
            ("model_hint", "Model hint"),
            ("serial_location", "Serial location"),
            ("range_start", "Range start"),
            ("range_end", "Range end"),
            ("family", "Family"),
            ("series", "Series"),
            ("series_hint", "Series hint"),
            ("sequence", "Sequence"),
            ("rank", "Rank"),
            ("batch", "Batch"),
            ("production_number", "Production number"),
            ("unit_identifier", "Unit identifier"),
            ("required_context", "Required context"),
            ("prefix", "Prefix")
        ]
        return labels.compactMap { key, label in
            guard let value = result.decoded[key]?.description, !value.isEmpty else { return nil }
            return (label, value)
        }
    }
}

struct ScopeStrip: View {
    let brand: BrandID

    var body: some View {
        ViewThatFits(in: .horizontal) {
            horizontalScope
            verticalScope
        }
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .accessibilityIdentifier("scope-strip")
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(brandDisplayName) analyzer scope")
    }

    private var horizontalScope: some View {
        Grid(alignment: .leading, horizontalSpacing: 1, verticalSpacing: 1) {
            GridRow {
                ForEach(scopeCells, id: \.label) { cell in
                    ScopeCell(label: cell.label, value: cell.value)
                }
            }
        }
        .background(.separator)
    }

    private var verticalScope: some View {
        VStack(alignment: .leading, spacing: 1) {
            ForEach(scopeCells, id: \.label) { cell in
                ScopeCell(label: cell.label, value: cell.value)
            }
        }
        .background(.separator)
    }

    var scopeCells: [(label: String, value: String)] {
        [
            ("Scope", scope.0),
            (scope.1, scope.2),
            (scope.3, scope.4)
        ]
    }

    var scope: (String, String, String, String, String) {
        switch brand {
        case .martin:
            ("Standard guitars and ukuleles", "Current table", "1898-2025", "Separate tables", "LX, Backpacker, mandolin, ukulele variants")
        case .taylor:
            ("Taylor documented serial formats", "Implemented", "10-digit, 9-digit, 11-digit, 4-prefix", "Range support", "Published pre-1993 ranges except ambiguous 1977 transition")
        case .prs:
            ("PRS set-neck and S2 models only", "Implemented", "Set-neck year prefix and S2 serial ranges", "Separate flows needed", "CE, SE, EG, Swamp Ash, bass, acoustic, amps, cabinets")
        case .gibson:
            ("Official Gibson guitar formats", "Implemented", "USA, Acoustic, Memphis, Custom Shop, Les Paul Classic", "Excluded", "Artist signature, Epiphone, Dobro, banjo, undocumented exceptions")
        case .fender:
            ("Scoped U.S., Mexico, Indonesia, and Japan-context Fender instruments", "Implemented", "U.S. early ranges, S/E/N, Z/DZ, V, 10, US; Mexico MN/MZ/MX; Indonesia IC/ICF; Japan JD context", "Separate flows needed", "Japan date decoding, Custom Shop, Korea, acoustic, amps, Mexico exceptions, Indonesia post-2012")
        case .epiphone:
            ("Gibson-documented Epiphone guitar formats", "Implemented", "Pre-2008 factory/date, Elite/Elitist, 2008-present numeric", "Excluded", "Factory-name mappings, Dobro, banjo, undocumented exceptions")
        case .collings:
            ("Collings electric serials and acoustic guidance", "Implemented", "Electric prefix, production-start year, sequence", "Records-assisted", "Acoustic exact ship date requires contacting Collings")
        }
    }

    var brandDisplayName: String {
        switch brand {
        case .martin: "Martin"
        case .taylor: "Taylor"
        case .prs: "PRS"
        case .gibson: "Gibson"
        case .fender: "Fender"
        case .epiphone: "Epiphone"
        case .collings: "Collings"
        }
    }
}

struct ScopeCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label.uppercased())
                .font(.caption.bold())
                .foregroundStyle(.secondary)
                .lineLimit(nil)
                .fixedSize(horizontal: false, vertical: true)
            Text(value)
                .font(.subheadline.bold())
                .lineLimit(nil)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label), \(value)")
    }
}

struct FooterView: View {
    var body: some View {
        ViewThatFits(in: .horizontal) {
            HStack {
                reviewedText
                Spacer()
                boundaryText
            }
            VStack(alignment: .leading, spacing: 6) {
                reviewedText
                boundaryText
            }
        }
        .font(.footnote)
        .foregroundStyle(.secondary)
        .accessibilityIdentifier("product-boundary-footer")
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Reviewed source data: 2026-06-23. Serial results do not establish authenticity, model identity, or value.")
    }

    private var reviewedText: some View {
        Text("Reviewed source data: 2026-06-23")
            .lineLimit(nil)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var boundaryText: some View {
        Text("Serial results do not establish authenticity, model identity, or value.")
            .lineLimit(nil)
            .multilineTextAlignment(.leading)
            .fixedSize(horizontal: false, vertical: true)
    }
}

#Preview {
    ContentView()
}

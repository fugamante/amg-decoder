// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "AMGDecoder",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "AnalyzerCore", targets: ["AnalyzerCore"]),
        .executable(name: "AMGDecoderApp", targets: ["AMGDecoderApp"])
    ],
    targets: [
        .target(
            name: "AnalyzerCore",
            resources: [
                .process("Resources")
            ]
        ),
        .executableTarget(
            name: "AMGDecoderApp",
            dependencies: ["AnalyzerCore"]
        ),
        .testTarget(
            name: "AnalyzerCoreTests",
            dependencies: ["AnalyzerCore"]
        )
    ]
)

module.exports = {
    "roots": [
        "<rootDir>/packages/content/test",
        "<rootDir>/packages/content-repository/test",
        "<rootDir>/packages/core/test",
        "<rootDir>/packages/http-api/test",
        "<rootDir>/packages/inject/test",
        "<rootDir>/packages/websocket-api/test",
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": "(/test/.*|(\\.|/)(test|spec))\\.tsx?$",
    "moduleFileExtensions": [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    "collectCoverage": true,
    "coverageReporters": ["json", "html"],
}
module.exports = {
  roots: [
    '<rootDir>/packages/auth-google/test',
    '<rootDir>/packages/core/test',
    '<rootDir>/packages/http-api/test',
    '<rootDir>/packages/inject/test',
    '<rootDir>/packages/logging/test',
    '<rootDir>/packages/odata/test',
    '<rootDir>/packages/repository/test',
    '<rootDir>/packages/typeorm-store/test',
    '<rootDir>/packages/websocket-api/test',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.{ts,tsx}', '!**/node_modules/**', '!**/vendor/**'],
  coverageReporters: ['text', 'json', 'html', 'cobertura'],
  reporters: ['jest-junit'],
  globals: {
    'ts-jest': {
      diagnostics: false,
      tsConfig: './tsconfig-base.json',
    },
  },
}

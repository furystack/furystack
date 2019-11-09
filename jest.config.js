module.exports = {
  roots: [
    '<rootDir>/packages/auth-google',
    '<rootDir>/packages/core',
    '<rootDir>/packages/http-api',
    '<rootDir>/packages/inject',
    '<rootDir>/packages/logging',
    '<rootDir>/packages/mongodb-store',
    '<rootDir>/packages/odata',
    '<rootDir>/packages/odata-fetchr',
    '<rootDir>/packages/redis-store',
    '<rootDir>/packages/repository',
    '<rootDir>/packages/shades',
    '<rootDir>/packages/typeorm-store',
    '<rootDir>/packages/websocket-api',
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/test/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '!**/*.d.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/index.ts',
  ],
  coverageReporters: ['text', 'json', 'html', 'cobertura'],
  reporters: ['default', 'jest-junit'],
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
      isolatedModules: true,
      tsConfig: './tsconfig-base.json',
    },
  },
}

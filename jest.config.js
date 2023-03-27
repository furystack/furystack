module.exports = {
  moduleFileExtensions: ['js', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!packages/shades-common-components/**',
    '!**/index.js',
  ],
  coverageReporters: ['text', 'json', 'html', 'cobertura'],
  reporters: ['default', 'jest-junit'],
  projects: [
    {
      displayName: 'common',
      roots: [
        '<rootDir>/packages/cache',
        '<rootDir>/packages/core',
        '<rootDir>/packages/inject',
        '<rootDir>/packages/logging',
        '<rootDir>/packages/repository',
        '<rootDir>/packages/utils',
        '<rootDir>/packages/rest-client-fetch',
      ],
      moduleFileExtensions: ['js', 'json', 'node'],
    },
    {
      displayName: 'service',
      roots: [
        '<rootDir>/packages/auth-google',
        '<rootDir>/packages/filesystem-store',
        '<rootDir>/packages/rest',
        '<rootDir>/packages/rest-service',
        '<rootDir>/packages/mongodb-store',
        '<rootDir>/packages/redis-store',
        '<rootDir>/packages/websocket-api',
        '<rootDir>/packages/security',
        '<rootDir>/packages/sequelize-store',
      ],
      moduleFileExtensions: ['js', 'json', 'node'],
    },
    {
      displayName: 'Shades',
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['js', 'json', 'node'],
      roots: [
        '<rootDir>/packages/shades',
        '<rootDir>/packages/shades-common-components',
        '<rootDir>/packages/shades-lottie',
        '<rootDir>/packages/shades-nipple',
      ],
    },
  ],
}

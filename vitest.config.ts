import { defineConfig } from 'vitest/config'

export default defineConfig({
  // roots: [
  //   '<rootDir>/packages/auth-google',
  //   '<rootDir>/packages/core',
  //   '<rootDir>/packages/filesystem-store',
  //   '<rootDir>/packages/rest',
  //   '<rootDir>/packages/rest-client-fetch',
  //   '<rootDir>/packages/rest-client-got',
  //   '<rootDir>/packages/rest-service',
  //   '<rootDir>/packages/inject',
  //   '<rootDir>/packages/logging',
  //   '<rootDir>/packages/mongodb-store',
  //   '<rootDir>/packages/redis-store',
  //   '<rootDir>/packages/repository',
  //   '<rootDir>/packages/utils',
  //   '<rootDir>/packages/websocket-api',
  //   '<rootDir>/packages/shades',
  //   '<rootDir>/packages/shades-common-components',
  //   '<rootDir>/packages/shades-lottie',
  //   '<rootDir>/packages/shades-nipple',
  //   '<rootDir>/packages/security',
  //   '<rootDir>/packages/sequelize-store',
  // ],
  // testEnvironment: 'jsdom',
  // moduleFileExtensions: ['js', 'json', 'node'],
  // collectCoverage: true,
  // collectCoverageFrom: [
  //   '**/*.{js,jsx}',
  //   '!**/node_modules/**',
  //   '!packages/shades-common-components/**',
  //   '!**/index.js',
  // ],
  // coverageReporters: ['text', 'json', 'html', 'cobertura'],
  // reporters: ['default', 'jest-junit'],
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'cobertura'],
    },
    reporters: ['default', 'junit'],
    outputFile: 'coverage/junit.xml',
    include: ['packages/**/src/**/*.{test,spec,tests,specs}.{ts,tsx}'],
    environment: 'jsdom',
  },
  build: {
    commonjsOptions: {
      strictRequires: 'debug',
    },
  },
})

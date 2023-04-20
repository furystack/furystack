import { defineWorkspace } from 'vitest/config'

const cfg = defineWorkspace(
  [
    {
      // COMMON
      test: {
        include: [
          'packages/utils/**/*.spec.ts',
          'packages/cache/**/*.spec.ts',
          'packages/core/**/*.spec.ts',
          'packages/inject/src/**/*.spec.ts',
          'packages/logging/src/**/*.spec.ts',
          'packages/repository/src/**/*.spec.ts',
          'packages/rest-client-fetch/src/**/*.spec.ts',
        ],
      },
    },
  ],

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
  //   projects: [
  //     {
  //       displayName: 'common',
  //       roots: [
  //         '<rootDir>/packages/cache/cjs',
  //         '<rootDir>/packages/core/cjs',
  //         '<rootDir>/packages/inject/cjs',
  //         '<rootDir>/packages/logging/cjs',
  //         '<rootDir>/packages/repository/cjs',
  //         '<rootDir>/packages/utils/cjs',
  //         '<rootDir>/packages/rest-client-fetch/cjs',
  //       ],
  //       moduleFileExtensions: ['js', 'json', 'node'],
  //     },
  //     {
  //       displayName: 'service',
  //       roots: [
  //         '<rootDir>/packages/auth-google/cjs',
  //         '<rootDir>/packages/filesystem-store/cjs',
  //         '<rootDir>/packages/rest/cjs',
  //         '<rootDir>/packages/rest-service/cjs',
  //         '<rootDir>/packages/mongodb-store/cjs',
  //         '<rootDir>/packages/redis-store/cjs',
  //         '<rootDir>/packages/websocket-api/cjs',
  //         '<rootDir>/packages/security/cjs',
  //         '<rootDir>/packages/sequelize-store/cjs',
  //       ],
  //       moduleFileExtensions: ['js', 'json', 'node'],
  //     },
  //     {
  //       displayName: 'Shades',
  //       testEnvironment: 'jsdom',
  //       moduleFileExtensions: ['js', 'json', 'node'],
  //       roots: [
  //         '<rootDir>/packages/shades/cjs',
  //         '<rootDir>/packages/shades-common-components/cjs',
  //         '<rootDir>/packages/shades-lottie/cjs',
  //         '<rootDir>/packages/shades-nipple/cjs',
  //       ],
  //     },
  //   ],
  // }
)

export default cfg

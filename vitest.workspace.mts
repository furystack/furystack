import { defineWorkspace } from 'vitest/config'

const cfg = defineWorkspace([
  {
    test: {
      name: 'Common',
      include: [
        'packages/utils/**/*.spec.ts',
        'packages/cache/**/*.spec.ts',
        'packages/core/**/*.spec.ts',
        'packages/inject/src/**/*.spec.ts',
        'packages/logging/src/**/*.spec.ts',
        'packages/repository/src/**/*.spec.ts',
        'packages/rest-client-fetch/src/**/*.spec.ts',
        'packages/i18n/src/**/*.spec.ts',
      ],
    },
  },
  {
    test: {
      name: 'Service',
      include: [
        'packages/auth-google/src/**/*.spec.ts',
        'packages/filesystem-store/src/**/*.spec.ts',
        'packages/rest/src/**/*.spec.ts',
        'packages/rest-service/src/**/*.spec.ts',
        'packages/mongodb-store/src/**/*.spec.ts',
        'packages/redis-store/src/**/*.spec.ts',
        'packages/websocket-api/src/**/*.spec.ts',
        'packages/security/src/**/*.spec.ts',
        'packages/sequelize-store/src/**/*.spec.ts',
      ],
    },
  },
  {
    test: {
      name: 'Shades',
      environment: 'jsdom',
      include: [
        'packages/shades/src/**/*.spec.(ts|tsx)',
        'packages/shades-common-components/src/**/*.spec.(ts|tsx)',
        'packages/shades-lottie/src/**/*.spec.(ts|tsx)',
        'packages/shades-nipple/src/**/*.spec.(ts|tsx)',
        'packages/shades-i18n/src/**/*.spec.(ts|tsx)',
        'packages/shades-mfe/src/**/*.spec.(ts|tsx)',
      ],
    },
  },
])

export default cfg

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      all: false,
      enabled: true,
      include: ['packages/**/src/**/*.ts', 'packages/**/src/**/*.tsx'],
    },
  },
})

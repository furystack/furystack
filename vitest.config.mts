import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ['packages/**/src/**/*.ts', 'packages/**/src/**/*.tsx'],
      exclude: ['packages/**/src/**/index.ts'],
    },
  },
})

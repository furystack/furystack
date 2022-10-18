import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'cobertura'],
    },
    reporters: ['default', 'junit'],
    outputFile: 'coverage/junit.xml',
    include: ['src/**/*.{test,spec,tests,specs}.{ts,tsx}'],
    teardownTimeout: 5000,
  },
  build: {
    commonjsOptions: {
      strictRequires: 'debug',
    },
  },
})

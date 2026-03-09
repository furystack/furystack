import { defineConfig, devices } from '@playwright/test'

const isInCi = !!process.env.CI

export default defineConfig({
  forbidOnly: isInCi,
  testDir: 'e2e',
  fullyParallel: true,
  retries: isInCi ? 2 : 1,
  workers: isInCi ? undefined : '50%',
  reporter: isInCi ? 'github' : 'line',
  expect: {
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
    },
  },
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:8080',
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      timeout: 60000,
    },
  ],
  webServer: {
    command: 'yarn start',
    // In CI: always start a fresh dev server.
    // Locally: reuse an already-running server on port 8080 (start one with `yarn start` if needed).
    reuseExistingServer: !isInCi,
    url: 'http://localhost:8080',
  },
})

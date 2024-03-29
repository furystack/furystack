import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'

const isInCi = !!process.env.CI

const config: PlaywrightTestConfig = {
  forbidOnly: isInCi,
  testDir: 'e2e',
  fullyParallel: true,
  retries: isInCi ? 2 : 0,
  reporter: isInCi ? 'github' : 'line',
  expect: {
    toHaveScreenshot: {
      threshold: 0.3,
      maxDiffPixelRatio: 0.03,
    },
  },
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:8080/',
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
    },
  ],
  webServer: {
    command: 'yarn start',
    reuseExistingServer: !isInCi,
    url: 'http://localhost:8080',
  },
}
export default config

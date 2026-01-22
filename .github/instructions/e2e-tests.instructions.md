---
applyTo: '**'
---

# E2E Test Instructions

## Overview

End-to-end (E2E) tests are implemented using [Playwright](https://playwright.dev/). All E2E tests are located in the `packages/shades-showcase-app` package.

## Running E2E Tests

1. **Install dependencies for the workspace:**
   ```bash
   yarn install
   ```
2. **Run the E2E tests using the workspace command:**
   ```bash
   yarn workspace @furystack/shades-showcase-app e2e
   ```
   This runs Playwright tests as defined in the package's scripts.

## Test Location

- All E2E test files are located within the `packages/shades-showcase-app` directory. The typical convention is to place them in a `tests` or `e2e` folder inside this package.

## Additional Notes

- Playwright configuration and test files should be found in the same package.
- For more details or custom Playwright commands, refer to the [Playwright documentation](https://playwright.dev/).


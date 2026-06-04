<!-- version-type: patch -->

# furystack

## 👷 CI

- Updated the CI test matrices (GitHub `build-test`, `showcase-ui-tests` and Azure Pipelines) to run on Node `24.x` and `26.x`, dropping `22.x` and `25.x`. Single-run pipelines (release, version check, changelog check) stay on Node `24.x`.
- Raised the minimum supported Node.js to `>=24.0.0` (Node 24 LTS) in `engines`, dropping Node 22.

## ⬆️ Dependencies

- Updated root dev tooling: `eslint` `^10.4.1`, `typescript-eslint` `^8.60.1`, `eslint-plugin-jsdoc` `^63.0.1`, `lint-staged` `^17.0.7`, `vite` `^8.0.16`, `vitest` `^4.1.8`, and `@vitest/coverage-istanbul` `^4.1.8`.

## 🔧 Chores

- Upgraded the Yarn release to `4.16.0` (`packageManager` field and `.yarnrc.yml`).

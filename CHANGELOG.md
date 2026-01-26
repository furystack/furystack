# Changelog

## [7.0.35] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors
- Updated `@furystack/rest-service` dependency with injector owner fix

## [7.0.34] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Revamped main README with improved project overview and package documentation
- Added `RELEASE.md` with documentation for the release process, prerequisites, and troubleshooting

### 📦 Build

- Updated Node.js engine requirement from `>=20.0.0` to `>=22.18.0`

### 👷 CI

- Replaced automatic `npm-release.yml` workflow with manual `release.yml` workflow
- New release workflow uses NPM Trusted Publishing (OIDC) for secure authentication
- Release workflow now runs build, lint, and tests before publishing

### ✨ Features

- Added `@furystack/yarn-plugin-changelog` for automated changelog management

### 🔧 Chores

- Migrated to centralized changelog management system

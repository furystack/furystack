# Changelog

## [7.0.38] - 2026-02-01

### 📚 Documentation

### Cursor AI Configuration for Code Reviews

Added specialized reviewer agents that can be invoked during code reviews to validate different aspects of changes:

- `reviewer-changelog` - Validates changelog entries have high-quality, descriptive content
- `reviewer-dependencies` - Checks dependency updates for security and compatibility concerns
- `reviewer-eslint` - Runs ESLint checks to catch linting violations automatically
- `reviewer-prettier` - Validates code formatting matches project standards
- `reviewer-tests` - Assesses test coverage and validates tests pass
- `reviewer-typescript` - Runs TypeScript type checking for type safety
- `reviewer-versioning` - Validates version bumps follow semantic versioning rules

### Cursor AI Skills for Development Workflow

Added skills to automate common development tasks:

- `fill-changelog` - Automates filling changelog entries based on branch changes
- `review-changes` - Orchestrates code review using the specialized reviewer agents

### Versioning and Changelog Guidelines

Added detailed documentation for the project's versioning and changelog workflow, including:

- Semantic versioning rules and when to use patch/minor/major bumps
- Changelog entry format with section mapping and quality guidelines
- Step-by-step instructions for the version bump and changelog process

- Added getting started guide to `@furystack/yarn-plugin-changelog` with installation, configuration, and CI/CD setup instructions

### ⬆️ Dependencies

- Updated workspace dependencies for Shades CSS styling feature

## [7.0.37] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [7.0.36] - 2026-01-26

### 🔧 Chores

- Fixed repository URLs in package metadata for `@furystack/mongodb-store` and `@furystack/sequelize-store`

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

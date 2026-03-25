# Changelog

## [8.1.6] - 2026-03-25

### 📦 Build

- Adapted root tsconfig.json for TypeScript 6 compatibility: removed deprecated `alwaysStrict`, consolidated `DOM.Iterable` into `DOM`, and added explicit `types: ["node"]`

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `@vitest/coverage-istanbul` from ^4.1.0 to ^4.1.1
- Upgraded `vite` from ^8.0.0 to ^8.0.2
- Upgraded `eslint` from ^10.0.3 to ^10.1.0
- Upgraded `typescript-eslint` from ^8.57.1 to ^8.57.2
- Upgraded `jsdom` from ^29.0.0 to ^29.0.1
- Upgraded `@types/jsdom` from ^28.0.0 to ^28.0.1
- Upgraded `eslint-plugin-playwright` from ^2.10.0 to ^2.10.1

## [8.1.5] - 2026-03-19

### ✨ Features

- Integrated `@furystack/eslint-plugin` into the monorepo ESLint configuration with `recommendedStrict` for all packages and `shadesStrict` for Shades-related packages.

### 🐛 Bug Fixes

- Switched root ESLint config from `tseslint.config()` to `defineConfig()` from `eslint/config` for proper type inference with the updated `@furystack/eslint-plugin` types.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- Bumped various workspace packages and upgraded the core dependency.

## [8.1.4] - 2026-03-11

### 🐛 Bug Fixes

- Switched root ESLint config from `tseslint.config()` to `defineConfig()` from `eslint/config` for proper type inference with the updated `@furystack/eslint-plugin` types

## [8.1.3] - 2026-03-10

### ⬆️ Dependencies

- Bumped `@furystack/shades` and `@furystack/shades-common-components` dependencies
- Updated `@furystack/core` dependency to the new major version

## [8.1.2] - 2026-03-07

### ⬆️ Dependencies

- Updated `eslint` from `^10.0.2` to `^10.0.3`
- Updated `eslint-plugin-playwright` from `^2.7.1` to `^2.9.0`
- Updated `lint-staged` from `^16.2.7` to `^16.3.2`
- Updated `ts-json-schema-generator` from `^2.5.0` to `^2.9.0`

### 📚 Documentation

- Updated Cursor rules and coding guidelines to use `customElementName` instead of `shadowDomName` in examples

## [8.1.1] - 2026-03-06

### 🔧 Chores

- Version bump for nested layout feature

## [8.1.0] - 2026-03-06

### ✨ Features

- Integrated `@furystack/eslint-plugin` into the monorepo ESLint configuration with `recommendedStrict` for all packages and `shadesStrict` for Shades-related packages

### 📚 Documentation

- Added guidance on avoiding module-level JSX constants to the Shades component development rules

### 📦 Build

- Added `eslint-plugin` to the TypeScript composite project references
- Added `eslint-plugin` test files to the Vitest configuration

## [8.0.15] - 2026-03-04

### ⬆️ Dependencies

- Updated `@furystack/shades` with nested router metadata support

## [8.0.14] - 2026-02-28

### 🔧 Chores

- Version bump for `@furystack/shades-common-components` dependency update

## [8.0.13] - 2026-02-28

### 📚 Documentation

- Updated the `CACHE_HANDLING` cursor rule with `contentProps` usage examples for `CacheView`

## [8.0.12] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [8.0.11] - 2026-02-26

### ⬆️ Dependencies

- Updated lockfile for new `google-auth-library` dependency in `@furystack/auth-google`
- Updated internal `@furystack/*` dependencies
- Bumped `@types/jsdom` from ^27.0.0 to ^28.0.0
- Bumped `eslint` from ^10.0.0 to ^10.0.2
- Bumped `eslint-plugin-jsdoc` from ^62.6.0 to ^62.7.1
- Bumped `eslint-plugin-playwright` from ^2.7.0 to ^2.7.1
- Bumped `typescript-eslint` from ^8.56.0 to ^8.56.1

### ✨ Features

- Added `LoginResponseStrategy` abstraction to decouple authentication from session/token creation across `@furystack/rest-service`, `@furystack/auth-jwt`, and `@furystack/auth-google`

## [8.0.10] - 2026-02-26

### ✨ Features

- Monaco editor in the showcase app now uses theme-derived colors instead of generic built-in themes

### 🔧 Chores

- Version bumps for `@furystack/shades-common-components` and `@furystack/shades-showcase-app`

## [8.0.9] - 2026-02-23

### ⬆️ Dependencies

- Updated `@furystack/shades-common-components` to pick up MarkdownEditor form integration features

## [8.0.8] - 2026-02-22

### 🧪 Tests

- Updated grid e2e test and snapshot to reflect the new `GameItem` data model and filter UI

### ✨ Features

- Added total entity count support to the entity-sync system — collection subscriptions now report entries and count as a unified, always-consistent state for building paginated UIs

## [8.0.7] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades`, `@furystack/shades-common-components`, and `@furystack/entity-sync-client`

## [8.0.6] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [8.0.5] - 2026-02-19

### ✨ Features

- Added Markdown components to `@furystack/shades-common-components` — see the package changelog for details

## [8.0.4] - 2026-02-19

### ⬆️ Dependencies

- Updated workspace dependencies

### ✨ Features

- Extended the icon system with metadata (`name`, `description`, `keywords`, `category`) and 41 new icons, growing the set from 69 to 110
- Replaced emoji strings with proper `Icon` components in the showcase app's navigation, sidebar, breadcrumbs, theme switcher, and page headers
- Added search and category-based filtering to the icons showcase page

## [8.0.3] - 2026-02-12

### ✨ Features

- Added `@furystack/entity-sync`, `@furystack/entity-sync-client`, and `@furystack/entity-sync-service` packages for real-time entity synchronization over WebSocket

### 📦 Build

- Added entity-sync packages to TypeScript project references (`packages/tsconfig.json`)
- Added entity-sync test globs to vitest configuration (`vitest.config.mts`)

## [8.0.2] - 2026-02-11

### 📚 Documentation

- Added Cursor rules for cache state handling in UI (`CACHE_HANDLING.md`)

## [8.0.1] - 2026-02-11

### 🐛 Bug Fixes

- Fixed `obsoleteRange()` and `removeRange()` in `@furystack/cache` throwing when the cache contains entries in non-loaded states
- Fixed `Router` and `NestedRouter` in `@furystack/shades` not abandoning stale navigations during rapid route changes
- Fixed `@furystack/sequelize-store` returning the wrong model instance after initialization

### ♻️ Refactoring

- Replaced `semaphore-async-await` with native promise deduplication across `@furystack/cache`, `@furystack/filesystem-store`, `@furystack/mongodb-store`, `@furystack/rest-service`, `@furystack/sequelize-store`, and `@furystack/shades`

### ⬆️ Dependencies

- Bump `eslint` from `^9.39.2` to `^10.0.0`
- Bump `@eslint/js` from `^9.39.2` to `^10.0.1`
- Bump `jsdom` from `^27.4.0` to `^28.0.0`
- Bump `typescript-eslint` from `^8.53.1` to `^8.55.0`
- Bump `eslint-plugin-jsdoc` from `^62.3.0` to `^62.5.4`
- Bump `eslint-plugin-playwright` from `^2.5.0` to `^2.5.1`
- Bump `ts-json-schema-generator` from `^2.4.0` to `^2.5.0`
- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@vitest/coverage-istanbul` from `^4.0.17` to `^4.0.18`
- Removed `semaphore-async-await` from all packages
- Updated internal dependencies

## [8.0.0] - 2026-02-09

### 🔧 Chores

- Updated workspace dependencies for layout system feature
- Workspace version bump for `@furystack/shades-common-components` minor release (List, Tree, and ContextMenu components)
- Version bump for showcase app refactoring

### ⬆️ Dependencies

- Updated shades-related workspace packages to new major versions
- Updated `@furystack/shades` dependency with microtask-based batched rendering
- Updated `@furystack/shades-common-components` with new Breadcrumb component
- Updated `@furystack/shades-showcase-app` with breadcrumb integration
- Updated `@furystack/shades` and `@furystack/shades-common-components` dependencies

### 📚 Documentation

### Updated Cursor IDE Rules

Enhanced the Cursor IDE coding guidelines for better AI assistance:

- **CODE_STYLE.mdc** - Expanded code style guidelines with detailed examples for naming conventions, import ordering, JSX formatting, and component structure patterns
- **TYPESCRIPT_GUIDELINES.mdc** - Improved TypeScript guidelines with clearer type inference recommendations, stricter `any` prohibition examples, and better utility type documentation

- Consolidated Cursor rules into focused Markdown files for library development and testing guidelines

### 💥 Breaking Changes

### Major Version Bump for Shades Rendering Engine Overhaul

The `@furystack/shades` package has been rewritten with a VNode-based reconciliation engine, removing the `element` render option, `onAttach`/`onDetach` hooks, and introducing `useHostProps` and `useRef`. All dependent shades packages have been updated accordingly.

### 📦 Build

- Updated workspace dependency versions for the shades major version bump

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

# Changelog

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

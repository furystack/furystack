# Changelog

## [1.0.10] - 2026-04-17

### ⬆️ Dependencies

- Raised `@yarnpkg/cli` to ^4.14.1 and `@yarnpkg/core` to ^4.7.0 so the plugin targets the Yarn 4.14 API line used by the repository, plus `@types/node` ^25.6.0 and dev `typescript` ^6.0.3 and `vitest` ^4.1.4.

## [1.0.9] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [1.0.8] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility
- Changed `moduleResolution` from `Node` to `Bundler` in tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `@yarnpkg/cli` from ^4.12.0 to ^4.13.0
- Upgraded `@yarnpkg/core` from ^4.5.0 to ^4.6.0
- Upgraded `@yarnpkg/fslib` from ^3.1.4 to ^3.1.5

## [1.0.7] - 2026-03-19

### ✨ Features

- 1.0.6 patch: updated `@types/node` dependency to ^25.3.5.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [1.0.6] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [1.0.5] - 2026-02-26

### ⬆️ Dependencies

- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [1.0.4] - 2026-02-19

### ⬆️ Dependencies

- Updated `clipanion`

## [1.0.3] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`

## [1.0.2] - 2026-02-01

### 📚 Documentation

### Getting Started Guide

Added a step-by-step installation and setup guide to the README covering:

- Package installation with `yarn add -D @furystack/yarn-plugin-changelog`
- `.yarnrc.yml` configuration with `changesetBaseRefs` and plugin path
- `.gitignore` setup to track version manifests and changelog drafts
- Recommended `package.json` scripts (`bumpVersions`, `applyReleaseChanges`)
- CI/CD setup examples with GitHub Actions workflows for version bump and changelog validation

## [1.0.1] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [1.0.0] - 2026-01-22

### 💥 Breaking Changes

### Initial release - Yarn plugin for automated changelog management

This new package provides a Yarn plugin that automates changelog generation and management in monorepos. It introduces three commands:

### ✨ Features

- **`yarn changelog create`** - Generates changelog drafts from `.yarn/versions/*.yml` version manifests. Supports `--dependabot` flag for auto-filling dependency update entries and `--force` to regenerate mismatched changelogs.

- **`yarn changelog check`** - Validates existing changelog drafts for correctness and completeness.

- **`yarn changelog apply`** - Applies changelog drafts to each package's `CHANGELOG.md` file, merging multiple entries and deduplicating content.

The plugin supports:

- Automatic template generation based on version bump type (patch/minor/major)
- Conventional commit style sections (Features, Bug Fixes, Documentation, etc.)
- Merging of multiple changelog chunks from different PRs
- Validation to ensure changelogs match version manifests

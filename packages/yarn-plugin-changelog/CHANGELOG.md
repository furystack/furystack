# Changelog

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

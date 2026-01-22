<!-- version-type: major -->
# @furystack/yarn-plugin-changelog

## ✨ Features

### Initial release - Yarn plugin for automated changelog management

This new package provides a Yarn plugin that automates changelog generation and management in monorepos. It introduces three commands:

- **`yarn changelog create`** - Generates changelog drafts from `.yarn/versions/*.yml` version manifests. Supports `--dependabot` flag for auto-filling dependency update entries and `--force` to regenerate mismatched changelogs.

- **`yarn changelog check`** - Validates existing changelog drafts for correctness and completeness.

- **`yarn changelog apply`** - Applies changelog drafts to each package's `CHANGELOG.md` file, merging multiple entries and deduplicating content.

The plugin supports:
- Automatic template generation based on version bump type (patch/minor/major)
- Conventional commit style sections (Features, Bug Fixes, Documentation, etc.)
- Merging of multiple changelog chunks from different PRs
- Validation to ensure changelogs match version manifests

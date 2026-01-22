# @furystack/yarn-plugin-changelog

A Yarn plugin for automated changelog generation and management in monorepos. It integrates with Yarn's version plugin to generate, validate, and apply changelog entries from version manifests.

## Installation

### As a Yarn Plugin (Recommended)

```bash
yarn plugin import https://raw.githubusercontent.com/furystack/furystack/main/packages/yarn-plugin-changelog/bundles/@yarnpkg/plugin-changelog.js
```

### From NPM

```bash
yarn plugin import @furystack/yarn-plugin-changelog
```

## Usage

This plugin provides three commands that work together with Yarn's version workflow:

### 1. Create Changelog Drafts

Generate changelog draft files from version manifests (`.yarn/versions/*.yml`):

```bash
yarn changelog create
```

This creates draft files in `.yarn/changelogs/` with template sections based on the version bump type (patch/minor/major).

**Options:**

| Flag                  | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `-v, --verbose`       | Show verbose output                                                    |
| `-f, --force`         | Regenerate changelogs with mismatched version types or invalid entries |
| `--dependabot`        | Auto-fill changelog for dependency updates (Dependabot PRs)            |
| `-m, --message <msg>` | Custom message for the changelog entry (used with `--dependabot`)      |

**Examples:**

```bash
# Generate changelog drafts for all version manifests
yarn changelog create

# Regenerate mismatched or invalid changelogs
yarn changelog create --force

# Auto-fill for Dependabot dependency updates
yarn changelog create --dependabot

# With custom message (e.g., from PR title)
yarn changelog create --dependabot -m "Bump lodash from 4.17.20 to 4.17.21"
```

### 2. Validate Changelogs

Validate that all changelog entries are complete and match their version manifests:

```bash
yarn changelog check
```

**Validates:**

- Every release in `.yarn/versions/*.yml` has a corresponding changelog file
- Major releases have filled "Breaking Changes" sections
- At least one section has content (not just placeholders)
- Version type in changelog matches the manifest

**Options:**

| Flag            | Description                                  |
| --------------- | -------------------------------------------- |
| `-v, --verbose` | Show verbose output including passing checks |

### 3. Apply Changelogs

Apply changelog drafts to each package's `CHANGELOG.md` file:

```bash
yarn changelog apply
```

This command:

- Reads all changelog drafts from `.yarn/changelogs/`
- Groups entries by package name
- Merges multiple entries for the same package (with deduplication)
- Prepends new entries to each package's `CHANGELOG.md`
- Deletes processed draft files

**Options:**

| Flag            | Description                                    |
| --------------- | ---------------------------------------------- |
| `-v, --verbose` | Show verbose output                            |
| `--dry-run`     | Show what would be done without making changes |

## Workflow

A typical release workflow using this plugin:

```bash
# 1. Make your changes and commit them

# 2. Bump versions (creates .yarn/versions/*.yml)
yarn version check --interactive

# 3. Generate changelog drafts
yarn changelog create

# 4. Edit the generated drafts in .yarn/changelogs/
#    Fill in the relevant sections with your changes

# 5. Validate changelogs
yarn changelog check

# 6. Apply version changes and changelogs
yarn version apply --all
yarn changelog apply

# 7. Commit and push
git add -A
git commit -m "Release"
```

## Changelog Draft Format

Draft files use a markdown format with conventional changelog sections:

```markdown
<!-- version-type: minor -->

# @scope/package-name

## 💥 Breaking Changes

(Only for major releases)

## ✨ Features

- Added new feature X

## 🐛 Bug Fixes

- Fixed issue with Y

## 📚 Documentation

## ⚡ Performance

## ♻️ Refactoring

## 🧪 Tests

## 📦 Build

## 👷 CI

## ⬆️ Dependencies

## 🔧 Chores
```

## Directory Structure

```
.yarn/
├── versions/           # Version manifests (created by yarn version)
│   └── abc123.yml
└── changelogs/         # Changelog drafts (created by this plugin)
    ├── @scope-package-a.abc123.md
    └── @scope-package-b.abc123.md
```

## License

GPL-2.0

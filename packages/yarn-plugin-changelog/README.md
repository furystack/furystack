# @furystack/yarn-plugin-changelog

A Yarn plugin for automated changelog generation and management in monorepos. It integrates with Yarn's version plugin to generate, validate, and apply changelog entries from version manifests.

## Getting Started

### Step 1: Install the Plugin

Import the plugin directly from the repository:

```bash
yarn plugin import https://raw.githubusercontent.com/furystack/furystack/refs/heads/develop/packages/yarn-plugin-changelog/bundles/%40yarnpkg/plugin-changelog.js
```

This will automatically add the plugin to your `.yarnrc.yml` and download it to `.yarn/plugins/`.

### Step 2: Configure Base Refs

Add the `changesetBaseRefs` setting to your `.yarnrc.yml` to specify which branches to compare against when checking for version bumps:

```yaml
changesetBaseRefs:
  - develop
  - origin/develop
  - master
  - origin/master
  - main
  - origin/main
```

### Step 3: Update `.gitignore`

Add these lines to your `.gitignore` to track version manifests and changelog drafts:

```gitignore
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
!.yarn/changelogs
```

### Step 4: Add Scripts to `package.json`

Add these recommended scripts to your root `package.json`:

```json
{
  "scripts": {
    "bumpVersions": "yarn version check --interactive",
    "applyReleaseChanges": "yarn version apply --all && yarn changelog apply && yarn prettier --write ."
  }
}
```

### Step 5: CI/CD Setup (Optional)

To enforce changelog entries in your CI pipeline, create these GitHub Actions workflows:

**`.github/workflows/check-version-bump.yml`:**

```yaml
name: Version checks
on:
  push:
    branches-ignore:
      - 'release/**'
      - 'master'
      - 'develop'
jobs:
  check:
    name: Check version bumps
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Check version bumps
        run: yarn version check
        env:
          CI: true
```

**`.github/workflows/check-changelog.yml`:**

```yaml
name: Changelog checks
on:
  push:
    branches-ignore:
      - 'release/**'
      - 'master'
      - 'develop'
  pull_request:
    branches:
      - develop
jobs:
  check:
    name: Check changelog completion
    timeout-minutes: 5
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      - name: Check changelog entries
        run: yarn changelog check
        env:
          CI: true
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

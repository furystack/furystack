<!-- version-type: patch -->

# furystack

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

### Git Flow Automation

Added TypeScript automation scripts for Git Flow workflows:

- `yarn gitflow:init` - Initialize Git Flow with project conventions (runs automatically on `yarn install`)
- `yarn release:start` - Start a new release with branch sync validation
- `yarn release:finish` - Finish a release and push to remotes
- `yarn release` - Unified release workflow that handles version bumps, changelog merging, and release creation in one step

The scripts provide user-friendly error messages and prerequisite checks for git and git-flow CLI availability.

## 🐛 Bug Fixes
<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation
<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance
<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring
<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests
<!-- PLACEHOLDER: Describe test changes (test:) -->

## 📦 Build

- Bumped minimum Node.js version requirement from 20.0.0 to 22.18.0 to enable native TypeScript execution for automation scripts

## 👷 CI
<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies
<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores
<!-- PLACEHOLDER: Describe other changes (chore:) -->

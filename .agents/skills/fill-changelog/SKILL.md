---
name: fill-changelog
description: Fill changelog entries for the current branch. Use when the user asks to fill changelog, write changelog entries, update changelog, or prepare changelog for a PR.
---

# fill-changelog

Automate filling changelog entries based on the changes in the current branch.

## Prerequisites

Version bumps MUST be configured before running this skill. If `yarn version check` fails, version files need to be adjusted first using `yarn version patch/minor/major` or `yarn bumpVersions` (interactive).

## Workflow

### Step 1: Validate Version Configuration

Run `yarn version check` to validate version manifests exist:

```bash
yarn version check
```

**If fails:** Stop and report error. The user must run `yarn version patch`, `yarn version minor`, `yarn version major`, or `yarn bumpVersions` first to configure version bumps.

### Step 2: Create/Recreate Changelog Drafts

Run with force flag to ensure all drafts are created or recreated:

```bash
yarn changelog create -f
```

This creates files in `.yarn/changelogs/` with the pattern `{package-name}.{manifest-id}.md`.

### Step 3: Analyze Branch Changes

Gather information about changes:

```bash
git diff develop...HEAD --stat
git log develop...HEAD --oneline
```

Read the changed files to understand what was actually modified.

### Step 4: Read Changelog Drafts

Use Glob to find `.yarn/changelogs/*.md` files, then Read to load their content.

### Step 5: Fill Changelog Entries

Map changes to the appropriate sections and fill the changelog drafts.

## Section Mapping

| Section             | When to Use                                    |
| ------------------- | ---------------------------------------------- |
| ✨ Features         | New functionality, new files, new capabilities |
| 🐛 Bug Fixes        | Corrections to existing behavior               |
| 📚 Documentation    | README, comments, documentation files          |
| ⚡ Performance      | Optimizations                                  |
| ♻️ Refactoring      | Code restructuring without behavior change     |
| 🧪 Tests            | Test additions/modifications                   |
| 📦 Build            | Build system, dependencies configuration       |
| 👷 CI               | CI/CD configuration changes                    |
| ⬆️ Dependencies     | Dependency updates                             |
| 🔧 Chores           | Other maintenance tasks                        |
| 💥 Breaking Changes | Major version only (REQUIRED)                  |
| 🗑️ Deprecated       | Minor/Major versions only                      |

## Quality Guidelines

### Writing Style: Documentation, NOT Git Log

Write for package consumers, not as git history.

**Avoid vague terms:**

- "improved", "updated", "refactored", "fixed bugs", "changed internal implementation"

**Use specific, actionable language:**

- "Added pagination support to `getUserList()` with page and limit parameters"
- "Fixed date picker not respecting user timezone in profile settings"

### Version-Specific Requirements

**Major Versions:**

- Document ALL breaking changes with descriptive titles
- Explain WHAT changed and WHY
- Include before/after code examples using ❌/✅ markers
- Provide migration guide with step-by-step instructions
- Explain impact (who is affected)

**Minor Versions:**

- Document new features with descriptive titles
- Provide usage examples
- Explain benefits/use cases

**Patch Versions:**

- Be specific about bug fixes (not vague "fixed bugs")
- Describe what was broken

### List Items Need Descriptions

When listing multiple items (features, agents, tools, etc.), each item should include a brief description of what it does and why it matters:

```markdown
// ❌ Bad - just names without context

- Added `reviewer-changelog`
- Added `reviewer-eslint`
- Added `reviewer-prettier`

// ✅ Good - each item explains its purpose

- Added `reviewer-changelog` - Validates changelog entries have high-quality, descriptive content
- Added `reviewer-eslint` - Runs ESLint checks to catch linting violations automatically
- Added `reviewer-prettier` - Validates code formatting matches project standards
```

Even for simple list items, the reader should understand **what** the item does without needing to look elsewhere.

## Entry Format Examples

### Simple List (straightforward changes)

```markdown
## ✨ Features

- Added `exportToCSV()` function for data export
- Implemented multi-select filtering in list views
```

### Detailed Entry (complex changes)

```markdown
## ✨ Features

### New Data Export Feature

Export data in multiple formats for analysis and reporting.

**Usage:**

\`\`\`typescript
import { exportData } from '@furystack/utils';

const result = await exportData(items, { format: 'csv' });
\`\`\`
```

### Breaking Changes (major versions)

```markdown
## 💥 Breaking Changes

### API Methods Now Use Object Parameters

Methods now accept object parameters instead of positional arguments.

**Examples:**

\`\`\`typescript
// ❌ Before
await injector.getInstance(MyService, arg1, arg2);

// ✅ After
await injector.getInstance(MyService, { arg1, arg2 });
\`\`\`

**Impact:** All callers of the affected methods need to be updated.

**Migration:** Search for method calls with `grep -r "getInstance" packages/` and update to object syntax.
```

## Validation

After filling entries, run:

```bash
yarn changelog check
```

This validates:

- Every release has a changelog file
- Major releases have filled "💥 Breaking Changes" section
- At least one section has content
- Version type matches the manifest

## Reference

For detailed guidelines, see:

- `.cursor/agents/reviewer-changelog.md` (will review the filled entries)

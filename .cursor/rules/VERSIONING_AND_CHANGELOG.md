# Versioning and Changelog Guidelines

## Overview

This project follows [Semantic Versioning (semver)](https://semver.org/) and maintains changelogs following [Keep a Changelog](https://keepachangelog.com/) format.

**CRITICAL RULE**: Every major or minor version bump MUST have a corresponding CHANGELOG.md entry with the version number and date.

**PHILOSOPHY**: Changelogs are **user documentation**, not git logs. Write for package consumers who need to understand what changed, why it matters, and how to adapt their code.

## Automated Validation

This project includes automated changelog validation via `yarn changelog check` command. The validation enforces:

### ✅ What Gets Validated

The `yarn changelog check` command validates changelog drafts in `.yarn/changelogs/` against version manifests:

**Critical Requirements (Errors):**

- Every release in `.yarn/versions/*.yml` must have a corresponding changelog file
- Major releases MUST have a filled "💥 Breaking Changes" section
- At least one section must have content (no empty changelogs)
- Version type in changelog must match the version manifest (patch/minor/major)

**Quality Guidelines (Not Enforced by Validation):**

While not automatically validated, follow these best practices:

- Major versions: Include migration guide with before/after code examples
- Minor versions: Document new features in "✨ Features" section
- Be specific: Avoid vague terms like "updated", "refactored", "improved"
- Write for users: Explain what changed and why it matters, not just what you did

### 🤖 CI Integration

The validation runs automatically on:

- Pull requests to `develop`
- Pushes to feature branches (excluding `release/**`, `master`, `develop`)

See `.github/workflows/check-changelog.yml` for CI configuration.

## Semantic Versioning

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes that require consumer code changes
- **MINOR** (X.Y.0): New features, backward-compatible additions
- **PATCH** (X.Y.Z): Bug fixes, backward-compatible fixes

### Examples

```
1.5.3 → 2.0.0  (major: breaking changes)
1.5.3 → 1.6.0  (minor: new features)
1.5.3 → 1.5.4  (patch: bug fixes)
```

## Version Management with Yarn

This project uses Yarn's deferred versioning:

1. Run `yarn bumpVersions` to interactively stage version bumps
2. Yarn creates files in `.yarn/versions/*.yml`
3. CD pipeline runs `yarn applyReleaseChanges` automatically
4. **DO NOT** manually run `yarn applyReleaseChanges`
5. **DO NOT** manually edit `package.json` versions

### Version Bump Commands

```bash
# Interactive version bump selection (recommended)
yarn bumpVersions

# Or use direct yarn version commands:
yarn version major  # Stage a major version bump
yarn version minor  # Stage a minor version bump
yarn version patch  # Stage a patch version bump
```

### Applying Changes (CD Pipeline Only)

The `yarn applyReleaseChanges` command:

1. Applies version bumps from `.yarn/versions/*.yml` to `package.json` files
2. Applies changelog drafts from `.yarn/changelogs/` to `CHANGELOG.md` files
3. Runs Prettier to format the changes

```bash
# This is run by the CD pipeline - DO NOT run manually
yarn applyReleaseChanges
```

## CHANGELOG.md Requirements

### Critical Rules

**💀 CRITICAL - Major Version Bumps:**

- ✅ MUST have CHANGELOG.md with version number and date
- ✅ MUST document ALL breaking changes with examples
- ✅ MUST include migration guide
- ✅ MUST show "before/after" code examples
- ✅ Version format: `## [X.0.0] - YYYY-MM-DD` (NOT `[Unreleased]`)

**🔥 HIGH - Minor Version Bumps:**

- ✅ MUST have CHANGELOG.md with version number and date
- ✅ MUST document new features
- ✅ SHOULD include usage examples
- ✅ Version format: `## [X.Y.0] - YYYY-MM-DD`

**🤔 MEDIUM - Patch Version Bumps:**

- ✅ SHOULD have CHANGELOG.md entry
- ✅ SHOULD document bug fixes
- ✅ Version format: `## [X.Y.Z] - YYYY-MM-DD`

### Exception: Shared Release-Wide Migration Guide

When a single coordinated release touches many packages and ships a **shared migration guide** (e.g. `docs/migrations/vX-name.md`) that documents the rationale, patterns, pitfalls, and common issues once for the whole release, per-package major CHANGELOG entries may be condensed:

- ✅ MUST link to the shared migration guide from the `💥 Breaking Changes` section.
- ✅ MUST list the package-specific API deltas (what was removed / renamed / moved, what replaces it).
- ⚠️ MAY omit the long-form migration guide, common-issues, and testing-checklist boilerplate — they live in the shared guide.
- ✅ The shared guide itself MUST include the items the per-package entry omits (prerequisites, step-by-step migration, common issues, testing checklist).

This keeps per-package changelogs scannable and avoids 30x duplication of the same prose across a monorepo-wide breaking change.

### Determining Version Number

When `.yarn/versions/*.yml` files exist in your changes:

1. **Read the version file:**

   ```yaml
   releases:
     '@furystack/core': major
     '@furystack/inject': major
   ```

2. **Look up current version** in `package.json`:

   ```json
   {
     "version": "1.5.3"
   }
   ```

3. **Calculate next version:**
   - `major`: 1.5.3 → 2.0.0
   - `minor`: 1.5.3 → 1.6.0
   - `patch`: 1.5.3 → 1.5.4

4. **Use in CHANGELOG.md:**
   ```markdown
   ## [2.0.0] - 2025-01-30
   ```
   **NOT** `[Unreleased]`

## CHANGELOG.md Format

### File Structure

````markdown
# Changelog

All notable changes to the `@furystack/package-name` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [X.Y.Z] - YYYY-MM-DD

### 🚨 Breaking Changes (for major versions)

#### Descriptive Title of Breaking Change

Explain what changed and why it matters to users.

**Examples:**

```typescript
// ❌ Before
oldAPI(param1, param2)

// ✅ After
newAPI({ param1, param2 })
```
````

**Impact:** Who is affected and what they need to do.

**Migration:** Step-by-step instructions.

### ✨ Added (for minor versions)

#### New Feature Name

Describe the feature and its benefits to users.

**Usage:**

```typescript
import { NewFeature } from '@furystack/package'

const result = NewFeature({ option: 'value' })
```

**Why This Matters:**

Explain the value and use cases.

### 🔧 Changed

- **What changed**: Describe the change
- **Why**: Explain the reasoning
- **Impact**: Who is affected (if any)

### 🐛 Fixed (for patch versions)

- **Fixed [specific issue]**: Describe what was broken and how it's fixed
- **Root cause**: Brief explanation (if relevant)

### 🗑️ Deprecated

- **Deprecated [feature/API]**: What's deprecated, when it will be removed, what to use instead

### ❌ Removed

- **Removed [feature]**: What was removed, why, and alternatives

### 📦 Dependencies

- **Updated**: `dependency-name` v1.x → v2.0 (reason for update)
- **Added**: `new-dependency` v1.0.0 (purpose)
- **Removed**: `old-dependency` (no longer needed because...)

## Migration Guide (for major versions)

### Step 1: Descriptive Step Title

Clear instructions with code examples.

### Step 2: Next Step

Continue with detailed guidance.

### Common Issues

**Issue:** Description of potential problem

**Solution:** How to fix it with examples

## [Previous.Version] - YYYY-MM-DD

...

````

### Changelog Sections

Use these sections as appropriate:

- **🚨 Breaking Changes**: Changes that break backward compatibility (required for major)
- **✨ Added**: New features (required for minor)
- **🔧 Changed**: Changes to existing functionality
- **🐛 Fixed**: Bug fixes (required for patch)
- **🗑️ Deprecated**: Soon-to-be-removed features
- **❌ Removed**: Removed features
- **🔒 Security**: Security fixes
- **📦 Dependencies**: Dependency updates

### Writing Style: Documentation, Not Git Log

**CRITICAL:** Changelogs are documentation for users, not a formatted git history. Write for your audience.

#### ❌ Git Log Style (DON'T DO THIS)

```markdown
### Changed

- Updated API methods
- Fixed some bugs
- Refactored internal code
- Updated dependencies
````

**Problems:**

- Too vague - users don't know what changed
- No context - why should users care?
- No examples - how do users adapt?
- Developer-focused - not user-focused

#### ✅ Documentation Style (DO THIS)

**For Simple Changes:**

```markdown
### 🚨 Breaking Changes

#### Method Renames

- `getUserData()` → `getUser()`
- `saveUserData()` → `updateUser()`
- `deleteUserData()` → `deleteUser()`

Update all method calls to use the new names.
```

**For Complex Changes:**

````markdown
### 🚨 Breaking Changes

#### API Methods Now Use Object Parameters

Methods now accept a single object parameter instead of multiple arguments:

```typescript
// Before
await client.updateUser(id, name, email)

// After
await client.updateUser({ id, name, email })
```

This makes optional parameters easier and improves type safety. Update all direct API calls.

**Common issue:** TypeScript error "Expected 1 argument, but got 3"  
**Solution:** Wrap your arguments in an object with named properties.
````

**Key Principles:**

1. **State what changed** - Be specific, not vague
2. **Show how to adapt** - Code example if not obvious
3. **Be concise** - Match detail to complexity
4. **Focus on action** - What users need to do

### Verbosity Guidelines: Simple When Possible, Detailed When Necessary

**Core Principle:** Match verbosity to complexity. Simple changes get simple descriptions. Complex changes get detailed explanations.

#### For Major Versions: Detailed But Focused

Major versions have breaking changes. Be clear and actionable:

**Simple Changes:**

- ✅ Direct statement of change: "`methodX` renamed to `methodY`"
- ✅ Brief migration: "Update all calls to use the new name"

**Complex Changes:**

- ✅ Explain WHAT changed and WHY
- ✅ Show code examples only when the change isn't obvious
- ✅ Provide migration steps if non-trivial
- ✅ List common issues only if anticipated

**Target:** Be as concise as possible while remaining clear and actionable.

#### For Minor Versions: Concise Feature Descriptions

Focus on what's new and how to use it:

**Simple Features:**

- ✅ One-line description: "Added `exportToCSV()` for data export"
- ✅ Basic usage if not obvious

**Complex Features:**

- ✅ Brief explanation of purpose and value
- ✅ One clear usage example
- ✅ Link to docs for details

**Target:** Brief and focused on the essentials.

#### For Patch Versions: Specific and Concise

- ✅ "Fixed date picker not respecting timezone settings"
- ✅ "Fixed memory leak in notification cleanup"
- ❌ Avoid: "Fixed various bugs"

**Target:** One clear line per fix.

### Audience-Focused Writing

#### Know Your Readers

**Primary audience**: Developers using your package
**Secondary audience**: Technical leads making upgrade decisions
**Tertiary audience**: Your future self reviewing changes

**Write for the primary audience** - developers who need to:

1. Understand if they need to upgrade
2. Know what will break if they upgrade
3. Learn how to use new features
4. Fix issues caused by bugs

#### Use Clear, Actionable Language

```markdown
❌ Bad: "Improved API"
✅ Good: "Added pagination support to getUserList() with page and limit parameters"

❌ Bad: "Fixed bugs"
✅ Good: "Fixed date picker not respecting user timezone in profile settings"

❌ Bad: "Updated authentication"
✅ Good: "Authentication now supports SSO via SAML 2.0 for enterprise users"

❌ Bad: "Changed internal implementation"
✅ Good: "Optimized query performance - getUsers() now loads 3x faster with large datasets"
```

#### Include Real-World Examples

Don't just describe changes - show them:

````markdown
✅ Good:

#### New Observable Batching Feature

Batch multiple observable updates to reduce re-renders:

**Basic Usage:**

```typescript
import { ObservableValue, batchUpdates } from '@furystack/utils'

const count = new ObservableValue(0)
const name = new ObservableValue('')

// Without batching: 2 separate updates
count.setValue(1)
name.setValue('John')

// With batching: single update notification
batchUpdates(() => {
  count.setValue(1)
  name.setValue('John')
})
```
````

**Use Cases:**

- Batch form field updates
- Optimize component re-renders
- Synchronize related state changes

````

### Structure for Different Version Types

#### Major Version Template

```markdown
## [X.0.0] - YYYY-MM-DD

### 🚨 Breaking Changes

#### [Change 1 Title]

[Detailed explanation with examples]

#### [Change 2 Title]

[Detailed explanation with examples]

### ✨ Added

- New features that came with the major version

### 🔧 Changed

- Non-breaking changes

### 📦 Dependencies

- Updated dependencies

## Migration Guide

### Prerequisites

- List any requirements

### Step 1: [First Step]

Detailed instructions

### Step 2: [Second Step]

Detailed instructions

### Common Issues

**Issue:** [Problem description]
**Solution:** [Fix with example]

### Testing Checklist

- [ ] Item to verify
- [ ] Another item to verify

## Need Help?

[Support resources]
````

#### Minor Version Template

```markdown
## [X.Y.0] - YYYY-MM-DD

### ✨ Added

#### [New Feature 1]

[Description with usage examples and benefits]

#### [New Feature 2]

[Description with usage examples and benefits]

### 🔧 Changed

- [Improvements that don't add features or break compatibility]

### 📦 Dependencies

- [Dependency updates if any]
```

#### Patch Version Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🐛 Fixed

- **Fixed [specific issue]**: [Description of what was broken and how it's fixed]
- **Fixed [another issue]**: [Description]

### 🔧 Changed

- [Minor improvements if any]
```

## Major Version CHANGELOG Example

````markdown
# Changelog

## [2.0.0] - 2025-01-30

### 🚨 Breaking Changes

#### Injector Now Requires Explicit Disposal

The `Injector` class now implements `Disposable` and requires explicit disposal:

**Examples:**

```typescript
// ❌ Before
const injector = new Injector()
// ... use injector
// (no cleanup needed)

// ✅ After
using injector = new Injector()
// ... use injector
// (automatically disposed at end of scope)

// Or manually:
const injector = new Injector()
try {
  // ... use injector
} finally {
  injector[Symbol.dispose]()
}
```
````

**Impact:** All code creating Injector instances needs to be updated.

#### ObservableValue.getValue() Now Returns Readonly

```typescript
// ❌ Before
const value = observable.getValue()
value.property = 'new' // Mutation worked but was discouraged

// ✅ After
const value = observable.getValue()
// value.property = 'new'; // TypeScript error: readonly

// To update:
observable.setValue({ ...value, property: 'new' })
```

### ✨ Added

- New `@furystack/cache` package for request caching
- Added `batchUpdates()` utility for batching observable changes
- Improved TypeScript inference for generic services

### 🔧 Changed

- Optimized Injector lookup performance
- Improved error messages for missing dependencies

### 📦 Dependencies

- Updated TypeScript to 5.9.x
- Added: `@furystack/cache` (workspace:^)

## Migration Guide

### Step 1: Update Injector Usage

Search for `new Injector()` and update to use `using` declaration:

```bash
grep -r "new Injector()" --include="*.ts" --include="*.tsx"
```

### Step 2: Update Observable Mutations

Search for direct mutations of observable values:

```bash
grep -r "\.getValue()\." --include="*.ts" --include="*.tsx"
```

### Step 3: Test

```bash
yarn test
yarn build
```

### Common Issues

**Issue:** TypeScript error: "Property 'x' does not exist on type 'Readonly<T>'"

**Solution:** Use `setValue()` with spread operator instead of mutating:

```typescript
// Before
observable.getValue().property = 'new'

// After
observable.setValue({ ...observable.getValue(), property: 'new' })
```

````

## Minor Version CHANGELOG Example

```markdown
# Changelog

## [1.6.0] - 2025-01-30

### ✨ Added

#### New Cache Package

Added `@furystack/cache` for efficient request caching:

```typescript
import { Cache } from '@furystack/cache';

const userCache = new Cache({
  capacity: 100,
  load: async (id: string) => fetchUser(id),
});

// First call fetches from API
const user1 = await userCache.get('user-1');

// Second call returns cached value
const user2 = await userCache.get('user-1');
````

#### Enhanced Logging

- Added structured logging with `ScopedLogger`
- Added log level filtering
- Added async log transport support

### 🔧 Changed

- Improved error messages for dependency injection failures
- Enhanced Observable performance for large subscriber lists

### 📦 Dependencies

- Updated `@vitest/coverage-istanbul` to v4.0.17

````

## Patch Version CHANGELOG Example

```markdown
# Changelog

## [1.5.4] - 2025-01-30

### 🐛 Fixed

- Fixed memory leak when disposing Injector with circular dependencies
- Fixed ObservableValue not notifying subscribers on rapid updates
- Fixed incorrect type inference for generic services

### 🔧 Changed

- Improved error messages for missing @Injectable decorator
````

## Common Mistakes and How to Fix Them

### Mistake 1: Using [Unreleased] When Version is Known

#### ❌ Wrong

```markdown
## [Unreleased]

### Changed

- Updated API methods
```

**Problems:**

- Uses `[Unreleased]` despite version file existing
- No date provided
- Vague description

#### ✅ Correct

````markdown
## [2.0.0] - 2025-01-30

### 🚨 Breaking Changes

#### API Method Signatures Changed to Object Parameters

Methods now accept object parameters instead of positional arguments:

```typescript
// ❌ Before
injector.getInstance(Service, options)

// ✅ After
injector.getInstance(Service, { options })
```
````

**Impact:** All API method calls must be updated.

## Migration Guide

1. Search for method calls: `grep -r "getInstance" src/`
2. Update each call to use object syntax
3. Run tests: `yarn test`

````

### Mistake 2: Git Log Style Instead of Documentation

#### ❌ Wrong

```markdown
### Changed

- Updated API
- Refactored code
- Fixed bugs
````

**Problems:**

- Too vague
- No context
- No examples
- Not user-focused

#### ✅ Correct

````markdown
### 🚨 Breaking Changes

#### Injectable Decorator Now Requires Lifetime Option

We've made the `lifetime` option explicit for better clarity:

**Examples:**

```typescript
// ❌ Before
@Injectable()
export class MyService {}

// ✅ After
@Injectable({ lifetime: 'transient' })
export class MyService {}
```
````

**Why This Change?**

- Makes service lifetime explicit
- Prevents accidental singleton creation
- Improves code readability

**Impact:** All @Injectable decorators must specify lifetime.

````

### Mistake 3: Wrong Date Format

#### ❌ Wrong

```markdown
## [2.0.0] - 2025-11-27
````

**Problem:** Date is incorrect (should be today's date)

#### ✅ Correct

```markdown
## [2.0.0] - 2025-01-30
```

**Rule:** Always use today's date in ISO 8601 format (YYYY-MM-DD)

## Changelog Validation Checklist

### Automated Validation (CI)

The `yarn changelog check` command validates:

- ✅ Every release in `.yarn/versions/*.yml` has a corresponding changelog draft in `.yarn/changelogs/`
- ✅ Major releases have filled "💥 Breaking Changes" section
- ✅ At least one section has content (no empty changelogs)
- ✅ Version type matches between manifest and changelog draft

### Manual Review Checklist

When reviewing code with version bumps, verify:

#### For Major Versions (💀 Critical)

**File Structure:**

- [ ] CHANGELOG.md exists in the package directory
- [ ] Version uses format `[X.0.0] - YYYY-MM-DD` (not `[Unreleased]`)
- [ ] Date is today's date in ISO format (YYYY-MM-DD)

**Content Quality:**

- [ ] All breaking changes are documented with descriptive titles
- [ ] Each breaking change explains WHAT, WHY, and WHO is affected
- [ ] Each breaking change has before/after code examples
- [ ] Examples show real code, not pseudocode
- [ ] Migration guide is included with step-by-step instructions
- [ ] Migration guide includes common issues and solutions
- [ ] Impact and effort estimation is provided
- [ ] Benefits of changes are explained
- [ ] Dependencies are documented with reasons for updates

**Writing Style:**

- [ ] Written as documentation, not git log
- [ ] User-focused language (not developer-focused)
- [ ] Verbose and thorough (200-500+ lines for major versions)
- [ ] Clear, actionable instructions
- [ ] No vague terms like "improved", "updated", "fixed some bugs"

**Code Examples:**

- [ ] Before/after examples for all breaking changes
- [ ] Examples are syntactically correct
- [ ] Examples use TypeScript with proper types
- [ ] Examples are realistic, not trivial
- [ ] Examples show common use cases

**Migration Guide:**

- [ ] Step-by-step instructions
- [ ] Prerequisites listed
- [ ] Commands provided for searching/updating code
- [ ] Testing checklist included
- [ ] Support resources mentioned

#### For Minor Versions (🔥 High)

**File Structure:**

- [ ] CHANGELOG.md exists in the package directory
- [ ] Version uses format `[X.Y.0] - YYYY-MM-DD`
- [ ] Date is today's date in ISO format

**Content Quality:**

- [ ] New features are documented with descriptive titles
- [ ] Each feature explains purpose and benefits
- [ ] Usage examples are provided
- [ ] Use cases are explained
- [ ] Limitations or caveats are mentioned
- [ ] Dependencies are documented

**Writing Style:**

- [ ] Written as documentation, not git log
- [ ] Descriptive and helpful (100-300+ lines)
- [ ] Shows value to users
- [ ] No vague feature descriptions

**Code Examples:**

- [ ] Basic usage example for each feature
- [ ] Advanced usage examples if applicable
- [ ] Examples are complete and runnable
- [ ] Real-world use cases shown

#### For Patch Versions (🤔 Medium)

**File Structure:**

- [ ] CHANGELOG.md entry exists (recommended)
- [ ] Version uses format `[X.Y.Z] - YYYY-MM-DD`
- [ ] Date is today's date in ISO format

**Content Quality:**

- [ ] Bug fixes are specific (not "fixed bugs")
- [ ] Each fix describes what was broken
- [ ] Root causes mentioned if relevant
- [ ] Side effects documented if any

**Writing Style:**

- [ ] Clear and specific
- [ ] User-focused (how does this affect them)
- [ ] Brief but complete (50-150 lines)

#### For All Versions

**Format:**

- [ ] Header format: `## [X.Y.Z] - YYYY-MM-DD`
- [ ] Date format: ISO 8601 (YYYY-MM-DD)
- [ ] Today's date (not future or past dates)
- [ ] Proper markdown formatting
- [ ] Code blocks use correct language tags
- [ ] Lists are properly formatted

**Sections:**

- [ ] Appropriate emoji prefixes (🚨, ✨, 🔧, 🐛, 📦)
- [ ] Sections are in logical order
- [ ] No empty sections
- [ ] Each section has meaningful content

**Language:**

- [ ] Clear and specific descriptions
- [ ] No vague terms ("improved", "updated", "refactored")
- [ ] Active voice preferred
- [ ] Present tense for current state
- [ ] Grammar and spelling correct
- [ ] Technical terms explained

**Examples:**

- [ ] Code examples are syntactically correct
- [ ] Code examples use proper TypeScript types
- [ ] Examples show real scenarios
- [ ] Examples include comments if complex
- [ ] Before/after examples use ❌ and ✅ markers

**Links:**

- [ ] All links work correctly
- [ ] Links to related changelogs included
- [ ] Links to documentation if applicable

**User Focus:**

- [ ] Written for package consumers, not developers
- [ ] Explains impact on users
- [ ] Provides actionable guidance
- [ ] Anticipates user questions
- [ ] Includes troubleshooting for common issues

## Tools and Commands

### Automated Changelog Validation

The yarn-plugin-changelog includes validation for changelog drafts:

```bash
# Validate all changelog drafts against version manifests
yarn changelog check

# Show verbose output
yarn changelog check -v
```

**What It Validates:**

✅ **Existence:**

- Every release in `.yarn/versions/*.yml` has a corresponding changelog file in `.yarn/changelogs/`

✅ **Content Requirements:**

- Major releases have filled "💥 Breaking Changes" section
- At least one section has content (no empty changelogs)

✅ **Consistency:**

- Version type in changelog draft matches the version manifest (patch/minor/major)

**Output Examples:**

```bash
# Success
✓ All 3 changelog(s) are valid.

# With errors - missing changelog
Changelog validation failed:

  ✗ Missing changelog for @furystack/core (manifest: abc12345). Run 'yarn changelog create' to generate it.

Found 1 error(s).

# With errors - major version missing breaking changes
Changelog validation failed:

  ✗ @furystack/core (@furystack-core.abc12345.md): Major release requires filled "💥 Breaking Changes" section

Found 1 error(s).

# With errors - empty changelog
Changelog validation failed:

  ✗ @furystack/inject (@furystack-inject.abc12345.md): At least one section must have content

Found 1 error(s).

# With errors - version type mismatch
Changelog validation failed:

  ✗ @furystack/core (@furystack-core.abc12345.md): Version type mismatch: changelog has "minor" but manifest expects "major". Run 'yarn changelog create --force' to regenerate.

Found 1 error(s).
```

### Manual Validation Commands

```bash
# Check for Version Manifests
# List pending version bumps
ls -la .yarn/versions/

# View version manifest content
cat .yarn/versions/*.yml

# Check for Changelog Drafts
# List changelog drafts
ls -la .yarn/changelogs/

# View changelog draft content
cat .yarn/changelogs/@furystack-core.*.md

# Find Current Version
# Get version from package.json
jq -r '.version' packages/core/package.json

# Or use grep
grep '"version"' packages/core/package.json

# Validate Changelog Draft
# Check if draft exists
test -f .yarn/changelogs/@furystack-core.*.md && echo "✅ Exists" || echo "❌ Missing"

# Check for Breaking Changes section in major version draft
grep -q "^### 💥 Breaking Changes" .yarn/changelogs/@furystack-core.*.md && echo "✅ Has breaking changes" || echo "❌ No breaking changes"

# Check that at least one section has content (not empty)
grep -q "^- " .yarn/changelogs/@furystack-core.*.md && echo "✅ Has content" || echo "❌ Empty"
```

## Best Practices

### 1. Write Changelogs for Your Users

Changelogs are for consumers of your package, not developers:

- ✅ Explain **what** changed and **why** it matters to them
- ✅ Show concrete **examples** they can copy-paste
- ✅ Provide **migration paths** for breaking changes
- ❌ Don't just list commit messages
- ❌ Don't use internal jargon

### 2. Be Specific and Actionable

```markdown
❌ Bad: "Improved API"
✅ Good: "Added pagination to getUserList() - now supports page and limit parameters"

❌ Bad: "Fixed bugs"
✅ Good: "Fixed Injector not disposing child instances when parent is disposed"
```

### 3. Group Related Changes

```markdown
✅ Good organization:

### 🚨 Breaking Changes

All breaking changes together with migration guide

### ✨ Added

All new features together

### 🐛 Fixed

All bug fixes together
```

### 4. Link to Documentation

```markdown
### ✨ Added

#### New Cache Package

Cache request results efficiently. See [Cache Documentation](./packages/cache/README.md) for details.
```

### 5. Credit Contributors (Optional)

```markdown
### 🐛 Fixed

- Fixed memory leak in Observable cleanup (thanks @username)
```

## Integration with CI/CD

The CD pipeline will:

1. Detect `.yarn/versions/*.yml` files
2. Run `yarn applyReleaseChanges` to:
   - Apply version bumps to `package.json` files
   - Apply changelog drafts to `CHANGELOG.md` files
   - Format with Prettier
3. Commit and tag the version
4. Publish to npm registry

**Important:** The changelog draft must exist BEFORE the CD pipeline runs, as it becomes part of the release.

## Summary

**Remember:**

1. 💀 **Major/Minor versions** → CHANGELOG.md is **REQUIRED**
2. 🤔 **Patch versions** → CHANGELOG.md is **RECOMMENDED**
3. 📅 **Use actual version and date**, not `[Unreleased]`
4. 📝 **Document breaking changes** with examples and migration guides
5. 🎯 **Write for your users**, not just for the git history
6. ✅ **Be specific, actionable, and clear**

When in doubt, over-communicate. Users prefer too much information over too little.

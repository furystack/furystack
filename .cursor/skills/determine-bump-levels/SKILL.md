---
name: determine-bump-levels
description: Detect which Yarn workspaces have changed and decide a default version bump level based on the semantic nature of the change.
inputs:
  - id: baseBranch
    type: string
    description: Base branch to diff against (default "origin/develop")
outputs:
  - id: changes
    type: object
    description: Mapping of workspace/package name to suggested semver bump ("patch", "minor", "major") or "decline".
---

# determine-bump-levels

## Overview

This skill analyses the diff between a branch and its base, determines for each changed package/workspace whether the change is a bugfix, new feature, or breaking change, and outputs the corresponding semver bump level.

The decision rules are:

| Type                                                                               | Semver    |
| ---------------------------------------------------------------------------------- | --------- |
| Bug‑fix only (no public API changes)                                               | `patch`   |
| New feature (public API added or changed)                                          | `minor`   |
| Breaking change / public API contract change, removal of exported symbol           | `major`   |
| Change that does not affect a deployed artifact (e.g. docs only, tests, CI config) | `decline` |

The output is a JSON object mapping each affected package/workspace to its suggested bump level.

## Step 1: Find changed workspaces

```bash
git fetch origin
git diff ${baseBranch}...HEAD --name-only
```

Collect all unique directories under `packages/` and the root workspace (.) that appear in the list. If a directory contains no source files (`*.ts`, `*.js`, etc.), mark it as _decline_.

## Step 2: Determine change type per package

For each affected package/workspace:

1. Run `git diff ${baseBranch}...HEAD -- <path>` to get the raw diff.
2. Apply heuristics:

- **Breaking** – if the diff removes or renames an exported symbol (`export`, `class`, `interface`, `type`) or changes a public function signature, or deletes a default export.
- **Feature** – if new symbols are added to the public API (new exports, classes, interfaces) and no breaking change is detected.
- **Bug‑fix** – if only internal implementation files are changed (`src/` but not `index.ts`, no new public symbols, no removed public symbols).
- **Type‑shape change** – modifications to exported type or interface definitions that alter the structure (e.g., adding or removing required fields) are treated as breaking.
- **Root workspace changes** – if the root `package.json` or `.yarn/manifest.yml` is altered, treat as major unless only devDependencies were added or removed.

3. If the diff contains only documentation changes (`*.md`, `README`, docs folder), test changes, CI config changes, or other non‑source modifications (e.g., `.github/*`, `.gitignore`), classify as _decline_.

These heuristics can be refined with a custom script or by invoking the `review-changes` sub‑agent for deeper analysis; however, the basic pattern matching above is sufficient for most cases.

## Step 3: Return result

Output a JSON object mapping each package/workspace name to its suggested bump level:

```json
{
  "packages/core": "minor",
  "packages/utils": "patch",
  ".": "major"
}
```

If no change requires a version bump, return an empty object.

## Decline cases

Return `"decline"` for entries that do not influence the deployed artifact (e.g., only documentation or test changes). This signals to downstream tooling that the package should remain unchanged in the release process.

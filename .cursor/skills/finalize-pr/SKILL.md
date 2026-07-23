---
name: finalize-pr
description: Finalize a pull request by bumping the version manifest yaml (yarn deferred version), creating changelog chunks and filling them, ensuring formatting. Triggered automatically after implementation and review are complete.
disable-model-invocation: false
inputs:
  - id: branch
    type: currentBranch
    description: The branch to finalize
  - id: bumpLevels
    type: object
    description: Mapping of package names (or 'workspace') to version bump level ('patch', 'minor', 'major', or 'none' to skip)
---

# finalize-pr

## Preconditions

- Implementation completed successfully.
- Code review finished without critical issues.

## Step 1: Validate version config

Run `yarn version check`. Completion criterion: exit code 0 and output contains "OK". If fails, abort with error message.

## Step 2: Bump version via `bump-versions`

Invoke the `bump-versions` skill, passing the `bumpLevels` mapping. The skill will run `yarn version <level> --deferred` for each package or workspace as specified.
The resulting new versions are written to `.yarn/manifest.yml` files per package. Completion criterion: all packages have updated manifests and the output indicates success.

## Step 3: Generate changelog chunks

Invoke the `fill-changelog` skill to create draft entries. Completion criterion: `fill-changelog` returns success.

## Step 4: Format codebase

Run `yarn format`. Completion criterion: exit code 0.

## Post-Completion

If all steps succeed, output a success message and close the PR (or mark it ready for merge).

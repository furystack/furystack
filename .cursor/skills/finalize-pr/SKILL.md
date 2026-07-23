---
name: finalize-pr
description: Finalize a pull request by automatically determining which workspaces changed, bumping their versions, generating changelog entries, and formatting the codebase.
disable-model-invocation: false
inputs:
  - id: branch
    type: currentBranch
    description: The branch to finalize
---

# finalize-pr

## Step 1: Validate version configuration

Run `yarn version check`. If it fails, abort the workflow – a proper release strategy must exist for each package.

## Step 2: Determine bump levels

Invoke the `determine-bump-levels` skill (default baseBranch = origin/develop). The skill returns a JSON mapping of workspace paths to a default bump level (currently "patch" for every change).

## Step 3: Bump versions via `bump-versions`

Pass the mapping returned from step 2 to the `bump-versions` skill. It runs `yarn workspace <path> version ${level} --deferred` for each package, updating `package.json` and writing `.yarn/manifest.yml` files.

## Step 4: Generate changelog chunks

Invoke the `fill-changelog` skill to create draft entries based on the new versions. Completion criterion: `fill-changelog` returns success.

## Step 5: Format codebase

Run `yarn format`. Completion criterion: exit code 0.

## Post‑Completion

If all steps succeed, output a success message and mark the PR ready for merge.

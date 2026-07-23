---
name: bump-versions
description: Bump the version of each package or workspace based on a provided mapping.
inputs:
  - id: bumpLevels
    type: object
    description: Mapping of package names (or 'workspace') to version bump level ('patch', 'minor', 'major', or 'none' to skip)
---

# bump-versions

## Preconditions

- The repository must use Yarn workspaces.

## Step 1: Iterate over mapping

For each key in `bumpLevels`:

- If value is `none`, skip.
- Resolve the package or workspace path. For a top‑level workspace, use `.`
- Run `yarn workspace <path> version ${level} --deferred`.
- The command updates the package's `package.json` and writes `.yarn/manifest.yml` with `{ "version": "<new>" }`.

## Post‑Completion

All affected packages should have updated manifests. If any command fails, abort.

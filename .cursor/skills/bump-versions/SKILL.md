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

- The repository must have the standard Yarn workspaces layout.
- The skill can be invoked even if a package has not yet been configured for a deferred bump; it will run the appropriate `yarn version <level> --deferred` command directly.

## Step 1: Iterate over mapping

For each key in `bumpLevels`:

- If value is `none`, skip.
- Resolve the package or workspace path. For a top‑level workspace, use `.`.

## Step 2: Run deferred version bump

Execute:

```bash
yarn --cwd <path> version ${level} --deferred
```

where `${level}` is the value from the mapping.
The command updates the package's `package.json` and writes a YAML file `.yarn/manifest.yml` with `{ version: "<new>" }`.

## Post‑Completion

All packages should have updated manifests. If any command fails, abort with an error message.

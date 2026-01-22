# Release Process

This document describes how to create a new release of FuryStack packages.

## Overview

Releases are automated via GitHub Actions. When triggered, the workflow:

1. Builds and tests the project
2. Applies version bumps and changelog updates
3. Commits changes and creates a release tag
4. Merges to master and publishes to NPM

## How to Release

### Prerequisites

Before triggering a release, ensure:

1. You're on the `develop` branch
2. All changes are committed and pushed
3. Version bumps have been prepared using `yarn bumpVersions`

### Preparing Version Bumps

```bash
# Interactive version bump selection
yarn bumpVersions
```

This will prompt you to select which packages need version bumps based on changes since the last release.

### Triggering the Release

1. Go to **GitHub Actions** → **Release to NPM**
2. Click **Run workflow**
3. Select `develop` branch
4. Click **Run workflow**

The workflow will automatically:

- Build the project
- Run lint and tests
- Apply version changes (`yarn applyReleaseChanges`)
- Commit all changes (including new CHANGELOG.md files)
- Push to develop
- Merge develop into master
- Create and push release tag (with `v` prefix)
- Publish all packages to NPM

## Required Permissions

### GitHub Repository Settings

#### Workflow Permissions

Go to **Settings** → **Actions** → **General** → **Workflow permissions**:

- Enable **Read and write permissions** for `GITHUB_TOKEN`

#### Branch Protection (if enabled)

If master branch has protection rules:

- Go to **Settings** → **Branches** → **master** → **Edit**
- Enable **Allow specified actors to bypass required pull requests**
- Add `github-actions[bot]`

### NPM Trusted Publishing

This project uses [NPM Trusted Publishing](https://docs.npmjs.com/trusted-publishers) for authentication. No `NPM_TOKEN` secret is required.

#### How It Works

- The workflow has `id-token: write` permission
- NPM authenticates the publish request via OIDC
- No `NPM_TOKEN` secret is required

#### Verifying Trusted Publisher Configuration

For each @furystack package on npmjs.com:

1. Go to **Package Settings** → **Trusted Publisher**
2. Verify configuration:
   - **Organization**: `furystack`
   - **Repository**: `furystack`
   - **Workflow filename**: `release.yml`

## Local Scripts

These scripts are available for local development:

```bash
# Interactive version bump selection
yarn bumpVersions

# Apply version changes and generate changelogs (used by CI)
yarn applyReleaseChanges
```

## Troubleshooting

### Workflow fails with "Not running from develop branch"

The release workflow can only be triggered from the `develop` branch. Make sure you select `develop` when running the workflow.

### NPM publish fails with authentication error

Verify that trusted publishing is configured correctly on npmjs.com for all @furystack packages. The workflow filename must match exactly (`release.yml`).

### Merge to master fails

This usually happens if master has diverged from develop. Ensure:

1. Master branch doesn't have commits that aren't in develop
2. Branch protection allows the github-actions bot to push

### No changes to commit

If the workflow reports "No changes to commit", this means `yarn applyReleaseChanges` didn't produce any changes. This could indicate:

- No version bumps were prepared (`yarn bumpVersions` wasn't run)
- Changes were already applied in a previous run

## Rollback Procedures

### If NPM publish fails after tag creation

The tag and commits are already pushed, but packages weren't published:

1. Fix the issue (e.g., NPM trusted publisher config)
2. Manually publish: `yarn workspaces foreach --all --no-private npm publish --tolerate-republish`

### If you need to undo a release

1. **Delete the tag locally and remotely:**

   ```bash
   git tag -d vX.Y.Z
   git push origin :refs/tags/vX.Y.Z
   ```

2. **Revert commits if needed:**

   ```bash
   git revert <commit-hash>
   git push origin develop master
   ```

3. **NPM packages cannot be unpublished** after 72 hours. If needed within 72 hours:

   ```bash
   npm unpublish @furystack/package-name@X.Y.Z
   ```

### If merge to master fails

The develop branch is already pushed, but the tag has not been created yet. To recover:

1. Resolve conflicts locally:

   ```bash
   git checkout master
   git merge develop
   # Resolve conflicts
   git push origin master
   ```

2. Manually create and push the tag:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

3. Manually publish packages:

   ```bash
   yarn workspaces foreach --all --no-private npm publish --tolerate-republish
   ```

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

## Repository Setup Guide

This section describes how to set up a new repository with the FuryStack release workflow patterns.

### Default Branch Configuration

Set `develop` as the default branch in GitHub Settings:

1. Go to **Settings** → **General** → **Default branch**
2. Change from `master` to `develop`
3. Click **Update**

**Why this matters:**

- Pull requests will target `develop` by default
- Feature work accumulates on `develop`
- Releases are controlled merges from `develop` to `master`
- This enables changelog and version checks on PRs before release

### GitHub App Setup (for Release Workflows)

Release workflows need to push commits to protected branches. A GitHub App allows this while maintaining branch protection.

#### Creating the GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**
2. Configure:
   - **Name**: `<org>-release-bot` (e.g., `furystack-release-bot`)
   - **Homepage URL**: Your repository URL
   - **Webhook**: Uncheck "Active" (not needed)
   - **Permissions**:
     - **Repository permissions** → **Contents**: Read and write
     - **Repository permissions** → **Metadata**: Read-only
   - **Where can this GitHub App be installed?**: Only on this account
3. Click **Create GitHub App**
4. Note the **App ID** shown on the app page
5. Scroll down and click **Generate a private key**
6. Save the downloaded `.pem` file securely

#### Installing the App

1. On the GitHub App page, click **Install App** in the sidebar
2. Select the repository (or all repositories)
3. Click **Install**

#### Adding Secrets

Add these secrets to each repository that uses the release workflow:

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `APP_ID`: The App ID from the GitHub App page
   - `APP_PRIVATE_KEY`: The contents of the `.pem` file

The release workflow uses these to generate a token that can push to protected branches:

```yaml
- name: Generate token
  uses: actions/create-github-app-token@v2
  with:
    app-id: ${{ secrets.APP_ID }}
    private-key: ${{ secrets.APP_PRIVATE_KEY }}
```

### Docker Hub Secrets (for Docker Deployment)

For repositories that deploy to Docker Hub (pi-rat, boilerplate, stack-craft):

#### Creating Docker Hub Access Token

1. Log in to [Docker Hub](https://hub.docker.com/)
2. Go to **Account Settings** → **Security** → **New Access Token**
3. Configure:
   - **Description**: `github-actions-<repo-name>`
   - **Permissions**: Read, Write, Delete
4. Click **Generate**
5. Copy the token (shown only once)

#### Adding Docker Secrets

Add these secrets to the repository:

1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets:
   - `DOCKER_USER`: Your Docker Hub username
   - `DOCKER_PASSWORD`: The access token from the previous step

### Branch Protection Rules

Configure branch protection for both `master` and `develop`:

1. Go to **Settings** → **Branches** → **Add branch protection rule**

#### For `develop` branch:

- **Branch name pattern**: `develop`
- **Require a pull request before merging**: ✓
- **Require status checks to pass before merging**: ✓
  - Add required checks: `build`, `lint`, `Version check`, `Changelog check`
- **Require branches to be up to date before merging**: ✓ (optional)
- **Allow specified actors to bypass required pull requests**: ✓
  - Add your GitHub App

#### For `master` branch:

- **Branch name pattern**: `master`
- **Require a pull request before merging**: ✓
- **Allow specified actors to bypass required pull requests**: ✓
  - Add your GitHub App

This configuration:

- Enforces code review and checks on all feature PRs to `develop`
- Allows the release workflow (via GitHub App) to merge `develop` → `master`
- Prevents accidental direct pushes to protected branches

### Quick Setup Checklist

For a new repository, complete these steps:

- [ ] Create `develop` branch from `master`
- [ ] Set `develop` as default branch in GitHub Settings
- [ ] Add workflow files:
  - [ ] `check-changelog.yml` - Validates changelog entries on PRs
  - [ ] `check-version-bump.yml` - Validates version bumps on PRs
  - [ ] `build-test.yml` - Build and test workflow
  - [ ] Release workflow (`npm-release.yml` or `publish-to-dockerhub.yml`)
- [ ] Create/install GitHub App and add `APP_ID` + `APP_PRIVATE_KEY` secrets
- [ ] (Docker repos) Add `DOCKER_USER` + `DOCKER_PASSWORD` secrets
- [ ] Configure branch protection rules for `develop` and `master`
- [ ] (NPM packages) Configure trusted publishing on npmjs.com

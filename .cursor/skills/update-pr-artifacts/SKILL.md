---
name: update-pr-artifacts
description: Orchestrates version bumping and changelog updates for a pull request.
inputs:
  - id: baseBranch
    type: string
    description: The base branch to compare against (default: origin/develop)
---

# update-pr-artifacts

This skill orchestrates the automatic updating of version information and changelogs for a pull request. It coordinates several agents and skills to ensure the release metadata is consistent and high-quality.

## Workflow

1. **Determine Bump Levels**:
   - Call the `determine-bump-levels` agent.
   - Provide the `baseBranch` as input.
   - Capture the resulting JSON map of workspaces to version levels.

2. **Bump Versions**:
   - Pass the JSON map from Step 1 to the `bump-versions` agent.
   - This agent will update `package.json` and the `.yarn/manifest.yml` files with deferred versions.

3. **Initialize Changelogs**:
   - Run `yarn changelog create -f` to create or refresh the draft changelog files in `.yarn/changelogs/`.

4. **Fill Changelogs**:
   - Call the `fill-changelog` agent.
   - This agent will analyze the changes and populate the changelog drafts with high-quality documentation.

5. **Verify Results**:
   - Run `yarn changelog check` to ensure all requirements (like breaking changes for major versions) are met.

## Error Handling

- If any step fails, stop the process and report the specific error to the user.
- Ensure that `bump-versions` completes successfully before attempting to create or fill changelogs.

## Problem Statement

The problem that the user is facing, from the user's perspective.

When performing dependency updates (e.g., via Dependabot or manual PRs), the automated changelog generation currently produces generic entries like "No changes in this version" or "Updated transitive dependencies" because it doesn't have visibility into the specific changes made to `package.json` files. This makes it difficult for users to quickly see exactly which dependencies were updated, added, or removed in a specific release.

## Solution

The solution to the problem, from the user's perspective.

Extend `@furystack/yarn-plugin-changelog` to support an optional dependency listing feature. When enabled, the plugin will compare the `package.json` of a specific package against its version in an upstream branch (e.g., `main`). It will then automatically generate a `## 📦 Dependencies` section in the changelog, listing the specific changes (additions and updates) in a deduplicated list.

## User Stories

1. As a developer, I want to enable dependency listing in my changelog config, so that my changelogs automatically reflect my dependency updates.
2. As a maintainer, I want to see a list of updated dependencies in a PR, so that I can quickly review the impact of a dependency change.
3. As a user of a library, I want to see which dependencies were updated in a new release, so that I can stay informed about the library's evolution.
4. As a developer, I want to specify an upstream branch (e.g., "main"), so that the plugin compares the current branch against the correct base.
5. As a developer, I want the changelog to only show unique dependencies, so that I don't see the same package listed multiple times if it's updated in different ways.
6. As a developer, I want the changelog to only show new versions, so that I don't clutter the changelog with removed dependencies.
7. As a developer, I want the dependency section to be optional, so that I can choose when to include it.
8. As a developer, I want the plugin to correctly handle both `dependencies` and `devDependencies`, so that all relevant changes are captured.
9. As a developer, I want the plugin to handle whitespace and ordering differences between the local and upstream `package.json` files, so that it doesn't report false positives for changes.
10. As a developer, I want the plugin to support a default upstream branch (e.g., "main"), so that I don't have to configure it every time.
11. As a developer, I want clear error messages if the upstream branch cannot be reached, so that I know why the dependency list is missing.
12. As a developer, I want the dependency entries to be formatted consistently (e.g., `- package@version`), so that the changelog remains readable.

## Implementation Decisions

- **Scope**: The plugin will focus on a single package's `package.json` for the diff, rather than the whole workspace.
- **Comparison Method**: Use `git show <upstream_branch>:<path_to_package.json>` to retrieve the upstream file content and compare it with the local file content.
- **Data Extraction**: Parse both the local and upstream `package.json` files as JSON objects.
- **Diffing Logic**:
  - Identify "Added" packages: present in local but not in upstream.
  - Identify "Updated" packages: present in both but with different versions in local.
  - Omit "Removed" packages from the changelog output.
- **Deduplication**: The final list of dependencies will be deduplicated by package name.
- **Configuration**:
  - `includeDependencies`: Boolean flag (default: `false`).
  - `upstreamBranch`: String for the base branch (default: `"main"`).
- **Formatting**: Inject a `## 📦 Dependencies` section into the final output if changes are detected and the flag is enabled.
- **Error Handling**: If the `git` command fails or the upstream file is inaccessible, the plugin should gracefully skip the dependency section and log a warning.

## Testing Decisions

- **Unit Tests**:
  - Test the diffing utility with various mock JSON objects (identical, added, updated, removed, different whitespace).
  - Test deduplication logic with multiple entries for the same package.
- **Integration Tests**:
  - Create a dummy repo with a `main` branch and a `feature` branch.
  - Simulate a dependency update on the `feature` branch.
  - Run the changelog generation and verify the existence and content of the `## 📦 Dependencies` section.
- **Mocking**: Mock the `git` command in unit tests to ensure tests are not dependent on the local git environment.

## Out of Scope

- Listing removed dependencies in the changelog.
- Detailed version history (e.g., "updated from x to y").
- Workspace-wide dependency diffing (only the package specified in the manifest).
- Automatically detecting the upstream branch (must be configurable).

## Further Notes

- We should ensure that the `git` command is available in the environment where the plugin runs (e.g., CI).
- The plugin should handle cases where `package.json` might not be a valid JSON (e.g., missing closing braces) gracefully.
- We will need to ensure the `git` command is called with the correct context (the package directory).

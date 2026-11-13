## Agent skills

### Issue tracker

Issues are tracked in the repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage labels are used to manage the lifecycle of issues. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a multi-context layout with a `CONTEXT-MAP.md` at the root. See `docs/agents/domain.md`.

## Repository notes

### Version manifests and changelog chunks (Yarn)

- Version bumps live in `.yarn/versions/<name>.yml` with a `releases:` map of workspace package names to `patch|minor|major` (include `furystack` when the root package is bumped).
- Each released package needs a matching changelog fragment in `.yarn/changelogs/<package-or-scope>.<name>.md` (e.g. `@furystack-rest-service.request-body-limit.md`, `furystack.request-body-limit.md`).
- Fragment format: `<!-- version-type: patch -->`, `# <package>`, then a section such as `## 🐛 Bug Fixes` with bullet entries. Use backticks for package/code names.
- `yarn version check` requires release strategies for workspaces affected by dependency bumps too: when bumping a package, include direct and transitive dependent workspaces in the manifest and add changelog fragments for them (typically “Patch release to include updated `<dependency>` dependency”).
- CI checks: `yarn version check` and `yarn changelog check`.

### Changelog encoding

- Write changelog fragments as UTF-8 (prefer no BOM). Emoji headings (e.g. `## 🐛 Bug Fixes`) can be mangled to `??` if written with the wrong encoding in PowerShell; verify the actual file contains the intended character (`U+1F41B` for 🐛), not just terminal display.
- When fixing encoding from PowerShell, write with `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`.

### Build and CI pitfalls

- `yarn build` runs `tsc -b packages` then builds `@furystack/yarn-plugin-changelog`; on Windows the plugin cleanup may fail on Unix `rm/mv` after a successful bundle. Use `yarn build:esm` to validate TypeScript compilation in isolation.
- Rest-service tests: `yarn exec vitest run packages/rest-service --coverage=false`.

### REST service request body handling

- Request bodies are read with a byte limit (default 1 MiB) and rejected with `413 Payload Too Large`; `useRestService` accepts `maxBodyBytes` per API.
- When enforcing/aborting oversized reads, do not destroy the incoming socket if a normal HTTP error response must be sent—drain/resume as needed and let the runtime return the 413 response.
- Built-in write endpoint generators should consume the body via the action `getBody()` helper so runtime limits/configuration are applied consistently.

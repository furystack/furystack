# AGENTS.md

## Repo shape

- Yarn 4 workspaces monorepo; Node >=24. Use `yarn`, never npm. Packages live in `packages/<kebab-case>`; the public surface is `src/index.ts` plus explicit `package.json` exports.
- ESM/NodeNext: use `.js` suffixes on relative imports. `strict` and `verbatimModuleSyntax` are enabled.
- `packages/tsconfig.json` is the build graph and `vitest.config.mts` lists test projects explicitly. Add a new package to both or `yarn build` / `yarn test` silently skip it.
- `@furystack/shades-showcase-app` is the only runnable app (`yarn start`, port 8080) and owns Playwright E2E.

## Commands

- Install: `yarn install` (CI uses `yarn install --immutable`).
- Build/typecheck: `yarn build` (`tsc -b packages` plus the changelog plugin bundle). `yarn clean` removes generated `esm/`, `types/`, and `tsbuildinfo`.
- Lint/format: `yarn lint`, `yarn format:check`, `yarn format`.
- Tests: `yarn test`; one file: `yarn test packages/core/src/in-memory-store.spec.ts`; one project: `yarn test --project Shades`. Projects are `Common`, `ESLint Plugin`, `Service`, `Shades`; coverage is on by default.
- Full suite needs `docker compose up -d` (MongoDB :27017, Redis :6379, MinIO :9000). Overrides: `MONGODB_URL`, `REDIS_URL`, `MINIO_URL` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`.
- `@furystack/redis-cross-node-bus` cross-process specs fork compiled output; run `yarn workspace @furystack/redis-cross-node-bus build` before running them in isolation.
- E2E: `yarn test:e2e`; single file: `yarn workspace @furystack/shades-showcase-app e2e test e2e/<file>`. First run: `yarn workspace @furystack/shades-showcase-app e2e install --with-deps`. Locally Playwright reuses an existing :8080 server.
- `yarn create-schemas` regenerates the REST integration JSON schema; run it after changing validated schemas.
- CI order: `format:check` -> `build` -> `lint` -> `create-schemas` -> `build:showcase` -> `test`.

## Change workflow

- `develop` is the integration branch (not master); releases are automated from `develop`.
- Every PR branch needs a version bump for each changed workspace, including the private root `furystack` workspace for repo-level files (`AGENTS.md`, `.agents/**`, `.cursor/**`), plus a changelog entry. Use `yarn version patch|minor|major` or `yarn bumpVersions`, then `yarn changelog create`, fill, and `yarn changelog check`. CI enforces both; use the `fill-changelog` skill.
- If `packages/yarn-plugin-changelog` changes, commit the rebuilt `bundles/` output; CI fails if `yarn build` leaves a diff there.
- Pre-commit runs lint-staged (`eslint --fix`, `prettier --write`).

## Conventions agents miss

- `.cursor/rules/*.mdc` are the source of truth for FuryStack conventions: `CODE_STYLE`, `TYPESCRIPT_GUIDELINES`, `COMPLEXITY`, `LIBRARY_DEVELOPMENT`, `SHADES_RENDER`, `TESTING_GUIDELINES`, `CACHE_HANDLING`. Read the relevant file before editing.
- Public API only through `package.json` `exports` (normally `src/index.ts`); no import-time side effects; JSDoc required on exports.
- Functional DI only (no decorators). App code resolves `DataSetToken`, not the underlying `StoreToken`. Tests wrap disposables in `using` / `usingAsync`; Shade DOM assertions need `await flushUpdates()`.
- Tests are co-located `*.spec.ts(x)`. Prefer `injector.bind` over mocks.
- Use `.agents/skills/` for create-shade-component, implement-store-adapter, write-tests, fill-changelog, and review-changes.

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

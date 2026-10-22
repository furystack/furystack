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
- Every PR branch needs a package version bump (`yarn version patch|minor|major` or `yarn bumpVersions`) and a changelog entry (`yarn changelog create`, fill, `yarn changelog check`). CI enforces both; use the `fill-changelog` skill.
- If `packages/yarn-plugin-changelog` changes, commit the rebuilt `bundles/` output; CI fails if `yarn build` leaves a diff there.
- Pre-commit runs lint-staged (`eslint --fix`, `prettier --write`).

## Conventions agents miss

- `.cursor/rules/*.mdc` are the source of truth for FuryStack conventions: `CODE_STYLE`, `TYPESCRIPT_GUIDELINES`, `COMPLEXITY`, `LIBRARY_DEVELOPMENT`, `SHADES_RENDER`, `TESTING_GUIDELINES`, `CACHE_HANDLING`. Read the relevant file before editing.
- Public API only via `src/index.ts`; no import-time side effects; JSDoc required on exports.
- Functional DI only (no decorators). App code resolves `DataSetToken`, not the underlying `StoreToken`. Tests wrap disposables in `using` / `usingAsync`; Shade DOM assertions need `await flushUpdates()`.
- Tests are co-located `*.spec.ts(x)`. Prefer `injector.bind` over mocks.
- Use `.agents/skills/` for create-shade-component, implement-store-adapter, write-tests, fill-changelog, and review-changes.

## Agent skills

### Issue tracker

Issues are tracked in the repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage labels are used to manage the lifecycle of issues. See `docs/agents/triage-labels.md`.

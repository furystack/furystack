# Context Map

Quick orientation for the FuryStack monorepo.

## Root

- `README.md` — project overview, package catalog, and links to public docs
- `CONTRIBUTING.md` — local setup, build/test commands, contribution workflow notes
- `AGENTS.md` — repo-specific instructions for coding agents
- `RELEASE.md` — release process and CI/NPM publishing details
- `azure-pipelines.yml`, `.github/workflows/` — CI and automation
- `docker-compose.yml` — local backing services (MongoDB/Redis/MinIO) for integration flows

## Source and packages

- `packages/*` — Yarn workspaces (framework packages and apps)
  - Core/DI/utils: `core`, `inject`, `utils`, `logging`, `cache`
  - Data/storage: `repository`, `*-store`, `blob-store`, `*-blob-store`
  - HTTP/auth: `rest`, `rest-service`, `rest-client-fetch`, `security`, `auth-jwt`, `auth-google`, `websocket-api`
  - UI (Shades): `shades`, `shades-common-components`, and related packages
  - Sync/tasks/tooling: `entity-sync*`, `task-runner*`, `cross-node-bus*`, `eslint-plugin`, `yarn-plugin-changelog`

Each package typically contains its own `README.md`, `src/`, tests, and package config.

## Documentation and planning

- `docs/agents/` — repository workflow notes (issues, labels, domain)
- `docs/internal/` — internal design/implementation notes
- `docs/migrations/` — migration guides/notes
- `plans/` — design and planning documents
- Public user-facing guides: https://furystack.github.io/getting-started/

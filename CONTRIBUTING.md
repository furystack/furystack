# Contributing to FuryStack

Thanks for contributing! FuryStack is a Yarn workspaces monorepo of TypeScript packages.

## Prerequisites

- **Node.js**: `>=24` (see root `package.json` `engines`)
- **Yarn**: `4.x` via Corepack (`corepack enable`), using the version pinned in `package.json`
- **Git**
- **Docker** (optional, for full local parity): some integration/UI flows use services from `docker-compose.yml` (MongoDB, Redis, MinIO)

## Getting started

```bash
git clone https://github.com/furystack/furystack.git
cd furystack
yarn install
```

## Common commands

```bash
# Build all packages (TypeScript project refs + changelog plugin)
yarn build

# Faster TypeScript-only build (useful on Windows if plugin cleanup is flaky)
yarn build:esm

# Run unit tests
yarn test

# Lint and format checks
yarn lint
yarn format:check

# Showcase app UI/e2e (requires build + Playwright browsers in that workspace)
yarn build:showcase
yarn test:e2e
```

Notes:

- Full CI also runs schema generation and other checks (see `azure-pipelines.yml` and workflows under `.github/workflows/`).
- For local integration testing with backing services, start dependencies with `docker compose up -d`.

## Repository layout

- `packages/*` — publishable (and a few private) workspace packages
- `docs/` — internal docs and migrations (`docs/internal`, `docs/migrations`)
- `plans/` — planning/design notes
- `CONTEXT-MAP.md` — quick map of where things live

## Documentation and guides

- Public framework docs and tutorials: https://furystack.github.io/getting-started/
- Package-specific API docs: each package `README.md`
- Issues and labels: see `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`

## Versioning and changelogs (Yarn)

When a change requires a release entry:

- Add/update a version manifest in `.yarn/versions/*.yml` (`yarn bumpVersions` is the interactive helper)
- Add matching changelog fragments in `.yarn/changelogs/`
- Run `yarn version check` and `yarn changelog check` as needed

Follow SemVer for public package changes (patch fixes/docs-safe clarifications as appropriate, minor for backward-compatible features, major for breaking API changes).

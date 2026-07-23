# Furystack Agent Instructions

### Setup

- Install dependencies: `yarn install` (Yarn 4 workspace, Node >= 24).
- Ensure Docker is installed for integration tests.

### Build

- Build all packages: `yarn build`.
- Build showcase app only: `yarn build:showcase`.
- Build a single package: `yarn workspace @furystack/<pkg> build`.

### Start

- Start the showcase app: `yarn start` or `yarn workspace @furystack/shades-showcase-app start`.

### Tests

- Run all tests: `yarn test`.
- Debug tests: `yarn test:debug`.
- E2E UI tests:
  - Install Playwright browsers: `yarn workspace @furystack/shades-showcase-app e2e install --with-deps`.
  - Run tests: `yarn test:e2e`.

### Schema Generation

- Generate JSON schemas for the REST service integration schema: `yarn create-schemas`.

### Lint & Format

- Lint code: `yarn lint`.
- Format code: `yarn format`; check formatting: `yarn format:check`.

### Clean

- Remove build artifacts: `yarn clean`.

### Docker Compose

- Start services for integration tests: `docker compose up -d` (stop with `docker compose down`).

### References

- Domain docs: see `CONTEXT-MAP.md` and context‑specific `CONTEXT.md`.
- Issue tracking: see `docs/agents/issue-tracker.md`.
- Triage labels: see `docs/agents/triage-labels.md`.

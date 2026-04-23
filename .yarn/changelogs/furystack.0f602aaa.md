<!-- version-type: major -->

# furystack

## 💥 Breaking Changes

Monorepo-wide **functional DI migration**. Decorators (`@Injectable`, `@Injected`) are gone; services are now declared with `defineService` / `defineStore` / `defineDataSet` and resolved through token-based `Injector` methods. Every package below is affected.

**Start here:** the [v7 migration guide](../../docs/migrations/v7-functional-di.md) documents rationale, global API deltas, per-package deltas, migration recipes, and common pitfalls. Each per-package `CHANGELOG.md` entry links the same guide and adds its package-specific API deltas on top.

### Packages bumped to the next major

- `@furystack/auth-google`
- `@furystack/auth-jwt`
- `@furystack/cache`
- `@furystack/core`
- `@furystack/entity-sync`
- `@furystack/entity-sync-client`
- `@furystack/entity-sync-service`
- `@furystack/eslint-plugin`
- `@furystack/filesystem-store`
- `@furystack/i18n`
- `@furystack/inject`
- `@furystack/logging`
- `@furystack/mongodb-store`
- `@furystack/redis-store`
- `@furystack/repository`
- `@furystack/rest`
- `@furystack/rest-client-fetch`
- `@furystack/rest-service`
- `@furystack/security`
- `@furystack/sequelize-store`
- `@furystack/shades`
- `@furystack/shades-common-components`
- `@furystack/shades-i18n`
- `@furystack/shades-lottie`
- `@furystack/shades-mfe`
- `@furystack/shades-nipple`
- `@furystack/shades-showcase-app`
- `@furystack/utils`
- `@furystack/websocket-api`

### Minimum Node version

Node.js ≥ 22 is required. Older Node fails with `ERR_REQUIRE_ESM` when the new jsdom test environment (used by the `Shades` vitest project) boots.

# furystack

[![Unit tests](https://github.com/furystack/furystack/actions/workflows/build-test.yml/badge.svg)](https://github.com/furystack/furystack/actions/workflows/build-test.yml)
[![UI tests](https://github.com/furystack/furystack/actions/workflows/showcase-ui-tests.yml/badge.svg)](https://github.com/furystack/furystack/actions/workflows/showcase-ui-tests.yml)

FuryStack is a flexible, end-to-end framework that allows you to build complex services quickly and easily.

- Written in TypeScript. The public APIs are clean and readable.
- The core is built on top of native Node.js calls. Dependencies are carefully selected.
- You can create a backend in minutes with authentication, data stores, custom actions, and 3rd-party packages. You don't have to waste time searching for packages for entry-level functionality.
- You can implement and use your own custom actions, WebSocket calls, data stores, or loggers easily.
- Custom front-end library with type-safe JSX syntax and unidirectional data binding.
- The same concepts and design principles are shared between the frontend and backend. DI, logging, disposables, etc. work in the same way—and from the same package.

## Getting Started

- **Step-by-step guides:** [furystack.github.io/getting-started](https://furystack.github.io/getting-started/) (recommended for new users)
  - [Build from scratch](https://furystack.github.io/getting-started/from-scratch/) — minimal monorepo, DI, store/dataset, REST, and Shades UI
  - [Use the boilerplate](https://furystack.github.io/getting-started/boilerplate/) — ready-made full-stack template
  - Core concepts: [Dependency Injection](https://furystack.github.io/getting-started/inject/), [Data Stores](https://furystack.github.io/getting-started/data-stores/), [Repository/DataSets](https://furystack.github.io/getting-started/repository/), [REST](https://furystack.github.io/getting-started/rest/), [Data Validation](https://furystack.github.io/getting-started/data-validation/)

Install packages as needed with npm or yarn:

```bash
npm install @furystack/core @furystack/inject
# or
yarn add @furystack/core @furystack/inject
```

### Prerequisites

- **Node.js**: `>=24` (see `package.json` engines)
- **Yarn**: `4.x` via Corepack (`packageManager` in `package.json`)
- **Docker** (optional, for full local parity): integration and UI test flows may require services like MongoDB/Redis/MinIO (`docker-compose.yml`)

### Recommended starting points

- **Minimal backend/DI + in-memory data:** `@furystack/inject`, `@furystack/core`, `@furystack/repository`
- **Type-safe REST API:** add `@furystack/rest`, `@furystack/rest-service`, and `@furystack/rest-client-fetch` (share API types in a common package)
- **Persistent storage:** add a store adapter such as `@furystack/filesystem-store`, `@furystack/mongodb-store`, `@furystack/redis-store`, or `@furystack/sequelize-store`
- **Auth:** add `@furystack/security` and `@furystack/rest-service` HTTP auth helpers (and `@furystack/auth-jwt` / `@furystack/auth-google` as needed)
- **UI:** `@furystack/shades` (+ `@furystack/shades-common-components` for ready-made components)

## Packages

### Core

| Package                                          | Version                                                                                                                     | Description                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [@furystack/core](packages/core/README.md)       | [![npm](https://img.shields.io/npm/v/@furystack/core.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/core)       | Physical stores, `defineStore`, identity context, system-identity helpers |
| [@furystack/inject](packages/inject/README.md)   | [![npm](https://img.shields.io/npm/v/@furystack/inject.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/inject)   | Functional dependency injection (`defineService`, `Injector`, tokens)     |
| [@furystack/utils](packages/utils/README.md)     | [![npm](https://img.shields.io/npm/v/@furystack/utils.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/utils)     | Utilities: Disposables, ObservableValue, Retrier, Trace                   |
| [@furystack/logging](packages/logging/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/logging.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/logging) | Logging with scopes, levels, and custom loggers                           |
| [@furystack/cache](packages/cache/README.md)     | [![npm](https://img.shields.io/npm/v/@furystack/cache.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/cache)     | In-memory caching with expiration and capacity limits                     |

### Data Storage

| Package                                                                      | Version                                                                                                                                                 | Description                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [@furystack/repository](packages/repository/README.md)                       | [![npm](https://img.shields.io/npm/v/@furystack/repository.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/repository)                       | Repository pattern with DataSets, authorization, and event callbacks |
| [@furystack/filesystem-store](packages/filesystem-store/README.md)           | [![npm](https://img.shields.io/npm/v/@furystack/filesystem-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/filesystem-store)           | File-based store for development and testing                         |
| [@furystack/mongodb-store](packages/mongodb-store/README.md)                 | [![npm](https://img.shields.io/npm/v/@furystack/mongodb-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/mongodb-store)                 | MongoDB document store implementation                                |
| [@furystack/redis-store](packages/redis-store/README.md)                     | [![npm](https://img.shields.io/npm/v/@furystack/redis-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/redis-store)                     | Redis key-value store implementation                                 |
| [@furystack/sequelize-store](packages/sequelize-store/README.md)             | [![npm](https://img.shields.io/npm/v/@furystack/sequelize-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/sequelize-store)             | SQL databases via Sequelize ORM                                      |
| [@furystack/blob-store](packages/blob-store/README.md)                       | [![npm](https://img.shields.io/npm/v/@furystack/blob-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/blob-store)                       | Transport-agnostic large-binary storage primitive                    |
| [@furystack/filesystem-blob-store](packages/filesystem-blob-store/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/filesystem-blob-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/filesystem-blob-store) | Filesystem-backed blob store adapter                                 |
| [@furystack/s3-blob-store](packages/s3-blob-store/README.md)                 | [![npm](https://img.shields.io/npm/v/@furystack/s3-blob-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/s3-blob-store)                 | S3-compatible blob store adapter                                     |

### REST API

| Package                                                              | Version                                                                                                                                         | Description                                                           |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [@furystack/rest](packages/rest/README.md)                           | [![npm](https://img.shields.io/npm/v/@furystack/rest.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest)                           | REST API type definitions and contracts                               |
| [@furystack/rest-service](packages/rest-service/README.md)           | [![npm](https://img.shields.io/npm/v/@furystack/rest-service.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest-service)           | Server implementation with authentication, static files, and proxying |
| [@furystack/rest-client-fetch](packages/rest-client-fetch/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/rest-client-fetch.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest-client-fetch) | Browser client using native fetch                                     |
| [@furystack/websocket-api](packages/websocket-api/README.md)         | [![npm](https://img.shields.io/npm/v/@furystack/websocket-api.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/websocket-api)         | WebSocket support for real-time communication                         |

### Security and Authentication

| Package                                                  | Version                                                                                                                             | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [@furystack/security](packages/security/README.md)       | [![npm](https://img.shields.io/npm/v/@furystack/security.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/security)       | Password management and authorization utilities |
| [@furystack/auth-google](packages/auth-google/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/auth-google.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/auth-google) | Google OAuth integration                        |
| [@furystack/auth-jwt](packages/auth-jwt/README.md)       | [![npm](https://img.shields.io/npm/v/@furystack/auth-jwt.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/auth-jwt)       | JWT authentication provider                     |

### Internationalization

| Package                                                  | Version                                                                                                                             | Description                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [@furystack/i18n](packages/i18n/README.md)               | [![npm](https://img.shields.io/npm/v/@furystack/i18n.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/i18n)               | Core i18n and translation management |
| [@furystack/shades-i18n](packages/shades-i18n/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-i18n.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-i18n) | I18n components for Shades UI        |

### UI Framework (Shades)

| Package                                                                            | Version                                                                                                                                                       | Description                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [@furystack/shades](packages/shades/README.md)                                     | [![npm](https://img.shields.io/npm/v/@furystack/shades.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades)                                     | JSX-based UI library with unidirectional data binding |
| [@furystack/shades-common-components](packages/shades-common-components/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-common-components.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-common-components) | Reusable components and CSS-variable theming system   |
| [@furystack/shades-mfe](packages/shades-mfe/README.md)                             | [![npm](https://img.shields.io/npm/v/@furystack/shades-mfe.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-mfe)                             | Micro-frontend support                                |
| [@furystack/shades-lottie](packages/shades-lottie/README.md)                       | [![npm](https://img.shields.io/npm/v/@furystack/shades-lottie.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-lottie)                       | Lottie animation wrapper                              |
| [@furystack/shades-nipple](packages/shades-nipple/README.md)                       | [![npm](https://img.shields.io/npm/v/@furystack/shades-nipple.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-nipple)                       | NippleJS joystick wrapper                             |
| [@furystack/shades-monaco](packages/shades-monaco/README.md)                       | [![npm](https://img.shields.io/npm/v/@furystack/shades-monaco.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-monaco)                       | Monaco Editor and Diff Editor components              |
| [@furystack/shades-showcase-app](packages/shades-showcase-app/README.md)           | [![npm](https://img.shields.io/npm/v/@furystack/shades-showcase-app.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-showcase-app)           | Demo application                                      |

### Messaging & Synchronization

| Package                                                                    | Version                                                                                                                                               | Description                                                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [@furystack/cross-node-bus](packages/cross-node-bus/README.md)             | [![npm](https://img.shields.io/npm/v/@furystack/cross-node-bus.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/cross-node-bus)             | Transport-agnostic cross-process publish/subscribe primitive |
| [@furystack/redis-cross-node-bus](packages/redis-cross-node-bus/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/redis-cross-node-bus.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/redis-cross-node-bus) | Redis Streams adapter for cross-node messaging               |
| [@furystack/entity-sync](packages/entity-sync/README.md)                   | [![npm](https://img.shields.io/npm/v/@furystack/entity-sync.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/entity-sync)                   | Shared protocol types for entity synchronization             |
| [@furystack/entity-sync-client](packages/entity-sync-client/README.md)     | [![npm](https://img.shields.io/npm/v/@furystack/entity-sync-client.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/entity-sync-client)     | Client-side entity synchronization                           |
| [@furystack/entity-sync-service](packages/entity-sync-service/README.md)   | [![npm](https://img.shields.io/npm/v/@furystack/entity-sync-service.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/entity-sync-service)   | Server-side entity synchronization                           |

### Background Tasks

| Package                                                                    | Version                                                                                                                                           | Description                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [@furystack/task-runner](packages/task-runner/README.md)                   | [![npm](https://img.shields.io/npm/v/@furystack/task-runner.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/task-runner)               | Transport-agnostic distributed task runner                      |
| [@furystack/task-runner-client](packages/task-runner-client/README.md)     | [![npm](https://img.shields.io/npm/v/@furystack/task-runner-client.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/task-runner-client) | Browser-side SDK for the task runner                            |
| [@furystack/redis-task-runner](packages/redis-task-runner/README.md)       | [![npm](https://img.shields.io/npm/v/@furystack/redis-task-runner.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/redis-task-runner)   | Redis Streams adapter for task runner queues                    |
| [@furystack/task-runner-examples](packages/task-runner-examples/README.md) | -                                                                                                                                                 | Worked examples for the task runner (private workspace package) |

### Tooling

| Package                                                                      | Version                                                                                                                                                 | Description                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [@furystack/yarn-plugin-changelog](packages/yarn-plugin-changelog/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/yarn-plugin-changelog.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/yarn-plugin-changelog) | Changelog generation from version manifests  |
| [@furystack/eslint-plugin](packages/eslint-plugin/README.md)                 | [![npm](https://img.shields.io/npm/v/@furystack/eslint-plugin.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/eslint-plugin)                 | Custom ESLint rules for FuryStack and Shades |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, build/test workflows, and contribution notes. This is a Yarn workspaces monorepo (`packages/*`). For framework usage docs, prefer the [public guides](https://furystack.github.io/getting-started/).

## License

This project is licensed under the GPL-2.0 License.

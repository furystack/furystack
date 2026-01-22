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

## Packages

### Core

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/core](packages/core/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/core.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/core) | Core framework with physical stores, store managers, and identity context |
| [@furystack/inject](packages/inject/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/inject.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/inject) | Dependency injection and IoC container |
| [@furystack/utils](packages/utils/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/utils.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/utils) | Utilities: Disposables, ObservableValue, Retrier, Trace |
| [@furystack/logging](packages/logging/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/logging.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/logging) | Logging with scopes, levels, and custom loggers |
| [@furystack/cache](packages/cache/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/cache.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/cache) | In-memory caching with expiration and capacity limits |

### Data Storage

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/repository](packages/repository/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/repository.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/repository) | Repository pattern with DataSets, authorization, and event callbacks |
| [@furystack/filesystem-store](packages/filesystem-store/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/filesystem-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/filesystem-store) | File-based store for development and testing |
| [@furystack/mongodb-store](packages/mongodb-store/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/mongodb-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/mongodb-store) | MongoDB document store implementation |
| [@furystack/redis-store](packages/redis-store/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/redis-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/redis-store) | Redis key-value store implementation |
| [@furystack/sequelize-store](packages/sequelize-store/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/sequelize-store.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/sequelize-store) | SQL databases via Sequelize ORM |

### REST API

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/rest](packages/rest/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/rest.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest) | REST API type definitions and contracts |
| [@furystack/rest-service](packages/rest-service/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/rest-service.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest-service) | Server implementation with authentication, static files, and proxying |
| [@furystack/rest-client-fetch](packages/rest-client-fetch/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/rest-client-fetch.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest-client-fetch) | Browser client using native fetch |
| [@furystack/websocket-api](packages/websocket-api/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/websocket-api.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/websocket-api) | WebSocket support for real-time communication |

### Security and Authentication

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/security](packages/security/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/security.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/security) | Password management and authorization utilities |
| [@furystack/auth-google](packages/auth-google/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/auth-google.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/auth-google) | Google OAuth integration |

### Internationalization

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/i18n](packages/i18n/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/i18n.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/i18n) | Core i18n and translation management |
| [@furystack/shades-i18n](packages/shades-i18n/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-i18n.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-i18n) | I18n components for Shades UI |

### UI Framework (Shades)

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/shades](packages/shades/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades) | JSX-based UI library with unidirectional data binding |
| [@furystack/shades-common-components](packages/shades-common-components/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-common-components.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-common-components) | Reusable components: DataGrid, Modal, Button, Input, etc. |
| [@furystack/shades-mfe](packages/shades-mfe/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-mfe.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-mfe) | Micro-frontend support |
| [@furystack/shades-lottie](packages/shades-lottie/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-lottie.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-lottie) | Lottie animation wrapper |
| [@furystack/shades-nipple](packages/shades-nipple/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-nipple.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-nipple) | NippleJS joystick wrapper |
| [@furystack/shades-showcase-app](packages/shades-showcase-app/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/shades-showcase-app.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades-showcase-app) | Demo application |

### Tooling

| Package | Version | Description |
| ------- | ------- | ----------- |
| [@furystack/yarn-plugin-changelog](packages/yarn-plugin-changelog/README.md) | [![npm](https://img.shields.io/npm/v/@furystack/yarn-plugin-changelog.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/yarn-plugin-changelog) | Changelog generation from version manifests |

# furystack

[![Unit tests](https://github.com/furystack/furystack/actions/workflows/build-test.yml/badge.svg)](https://github.com/furystack/furystack/actions/workflows/build-test.yml)
[![UI tests](https://github.com/furystack/furystack/actions/workflows/showcase-ui-tests.yml/badge.svg)](https://github.com/furystack/furystack/actions/workflows/showcase-ui-tests.yml)

FuryStack is a flexible, end-to-end framework that allows you to build complex services quickly and easily.

- Written in TypeScript. The public APIs are clean and readable.
- The core is built on top of native Node.js calls. Dependencies are carefully selected.
- You can create a backend in minutes with authentication, data stores, custom actions, and 3rd-party packages. You don't have to waste time searching for packages for entry-level functionality.
- You can implement and use your own custom actions, WebSocket calls, data stores, or loggers easily.
- Custom front-end library with type-safe JSX syntax and unidirectional data binding.
- The same concepts and design principles are shared between the frontend and backend. DI, logging, disposables, etc. work in the same way—and from the same package. 😉

## Layers of FuryStack

### @furystack/core [![npm](https://img.shields.io/npm/v/@furystack/core.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/core)

The entry-level logic (like store managers or server managers), models (definitions of physical stores, users, roles), and some entry-level implementations (like InMemoryStore and FileStore for testing) are included here.

### @furystack/repository [![npm](https://img.shields.io/npm/v/@furystack/repository.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/repository)

A repository is a collection of DataSets. A DataSet is like an extended version of a physical store—you can use a context (like a UserContext) for authorization or entity manipulation from DI. You can also subscribe to events here.

### @furystack/rest [![npm](https://img.shields.io/npm/v/@furystack/rest.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest)

If you want to communicate with the world, this package will be your friend. You can define your API as a TypeScript interface and implement it on the backend with [@furystack/rest-service](https://www.npmjs.com/package/@furystack/rest-service). Consuming these APIs is also easy with the [@furystack/rest-client-fetch](https://www.npmjs.com/package/@furystack/rest-client-fetch) package in the browser.

## Optional Goodies

### @furystack/auth-google [![npm](https://img.shields.io/npm/v/@furystack/auth-google.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/auth-google)

You can log in with a Google ID Token to a FuryStack backend with this simple package.

## Shades [![npm](https://img.shields.io/npm/v/@furystack/shades.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades)

@furystack/shades is a UI library that helps you create web UIs easily. The syntax is JSX and it also works with FuryStack tools like Logger or Inject. It uses unidirectional data binding.

## Utility Packages

### @furystack/utils [![npm](https://img.shields.io/npm/v/@furystack/utils.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/utils)

A collection of useful tools like `Disposable`s with `using()` and `usingAsync()` helpers, `deepMerge`, `Tracer`, and an ultra-lightweight Observer/Observable implementation.

### @furystack/logging [![npm](https://img.shields.io/npm/v/@furystack/logging.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/logging)

A powerful logging library that allows you to create log entries with scopes, levels, and custom data, and process them with your own logic. You can collect telemetry or create a crash dump collector.

### @furystack/inject [![npm](https://img.shields.io/npm/v/@furystack/inject.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/inject)

Inject is a DI/IoC utility that allows you to handle your dependencies easily and is the heart and soul of the stack. In short—just mark your services as `Injectable()` and use `injector.getInstance(...)` to retrieve them.
An injector can be extended with _extension methods_, so you can configure your whole app in one place in a type-safe way.

## Other Packages

### @furystack/cache

Simple in-memory caching utility to improve performance and reduce redundant computations.

### @furystack/filesystem-store

Filesystem-based store implementation, ideal for lightweight or experimental use.

### @furystack/i18n

General internationalization and translation management for FuryStack applications.

### @furystack/mongodb-store

MongoDB physical store implementation for scalable, document-based storage.

### @furystack/redis-store

Redis physical store implementation for fast, in-memory data storage (note: some features like `filter()` and `count()` are not supported).

### @furystack/security

Password management, authentication, and authorization utilities.

### @furystack/sequelize-store

Sequelize-based store implementation for SQL databases.

### @furystack/shades-i18n

Internationalization support for the Shades UI library.

### @furystack/shades-mfe

Micro frontend management utilities for Shades.

### @furystack/shades-showcase-app

Minimal showcase application demonstrating FuryStack Shades features.

### @furystack/websocket-api

WebSocket implementation for real-time communication in FuryStack.

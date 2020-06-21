# furystack

[![Build Status](https://dev.azure.com/furystack/FuryStack/_apis/build/status/furystack.furystack?branchName=master)](https://dev.azure.com/furystack/FuryStack/_build/latest?definitionId=1&branchName=master) [![Greenkeeper badge](https://badges.greenkeeper.io/furystack/furystack.svg)](https://greenkeeper.io/)

FuryStack is a flexible end-to-end framework that allows you to build complex services fast and easily.

- Written in Typescript. The public APIs are clean and readable.
- The Core is built on a top of native Node calls. Dependencies are carefully selected.
- You can create a backend in minutes with authentication, data stores, custom actions 3rd party packages. You don't have to waste your time looking for packages for entry-level functionality
- You can implement and use your own custom actions, websocket calls, data store or logger easily
- Custom front-end library with type safe JSX syntax and unidirectional data binding
- Same conceptions and design principles are shared between the frontend and the backend. DI, Logging, Disposables etc... works in the same way - and from the same package 😉

## Layers of FuryStack

### @furystack/core [![npm](https://img.shields.io/npm/v/@furystack/core.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/core)

The entry-level logic (like store managers or server managers) and models (definition of the Physical Stores, users, roles) and some entry-level implementation (like InMemoryStore and FileStore for testing) sits here.

### @furystack/repository [![npm](https://img.shields.io/npm/v/@furystack/repository.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/repository)

Repository is a collection of DataSets. A DataSet is like an extended version of a physical store - you can use a context (like a UserContext) for authorization or entity manipulation from the DI. You can subscribe to events here as well.

### @furystack/rest [![npm](https://img.shields.io/npm/v/@furystack/rest.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/rest)

If you want to communicate with the world, this package will be your friend. You can define your API as a Typescript interface and implement it on the backend with [@furystack/rest-service](https://www.npmjs.com/package/@furystack/rest-service). Consuming this APIs are also handy with the [@furystack/rest-client-fetch](https://www.npmjs.com/package/@furystack/rest-client-fetch) package in the browser.

## Optional goodies

### @furystack/auth-google [![npm](https://img.shields.io/npm/v/@furystack/auth-google.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/auth-google)

You can log in with a Google ID Token into a FuryStack backend with this simple package.

## Shades [![npm](https://img.shields.io/npm/v/@furystack/shades.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/shades)

@furystack/shades is a UI library that helps you to create web UIs easily. The syntax is JSX and it works also with @furytechs tools like Logger or Inject. Uses unidirectional data binding.

## Utility packages

### @furystack/utils [![npm](https://img.shields.io/npm/v/@furystack/utils.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/utils)

A collection of useful tools like `Disposable`s with `using()` and `usingAsync()` helpers, deepMerge, Tracer and an ultra-lightweight Observer/Observable implementation.

### @furystack/logging [![npm](https://img.shields.io/npm/v/@furystack/logging.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/logging)

A powerful logging library that allows you to create log entries with scopes, levels and custom data and process them with a logic you'd like. You can collect telemetry or create a crash dump collector.

### @furystack/inject [![npm](https://img.shields.io/npm/v/@furystack/inject.svg?maxAge=3600)](https://www.npmjs.com/package/@furystack/inject)

Inject is a DI / IOC utility that allows you to handle your dependencies easily is a hearth and soul of the stack. In short terms - Just mark your services as `Injectable()` and use `injector.getInstance(...)` to retrieve them.
An injector can be extended with _extension methods_, so you can configure your whole app in one place in a type safe way.

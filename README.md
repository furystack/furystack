# furystack

[![Build Status](https://dev.azure.com/furystack/FuryStack/_apis/build/status/furystack.furystack?branchName=master)](https://dev.azure.com/furystack/FuryStack/_build/latest?definitionId=1&branchName=master) [![Greenkeeper badge](https://badges.greenkeeper.io/furystack/furystack.svg)](https://greenkeeper.io/)

FuryStack is a flexible framework that allows you to build complex services fast and easily.

- Written in Typescript. The public APIs are clean and readable.
- The Core is built on a top of native Node calls. Dependencies are carefully selected.
- You can create a backend in minutes with authentication, data stores, custom actions and ODdata without 3rd party packages. You don't have to waste your time looking for packages for entry-level functionality
- You can create and use your own custom actions, websocket calls, data store or logger easily
- You can use some of the packages (logger and inject at the moment) on the frontend as well

## Layers of FuryStack

### @furystack/core

The entry-level logic (like store managers or server managers) and models (definition of the Physical Stores, users, roles) and some entry-level implementation (like InMemoryStore and FileStore for testing) sits here.

### @furystack/repository

Repository is a collection of DataSets. A DataSet is like an extended version of a physical store. You can create/retrieve/update/delete entries, but in an authorized way. You can subscribe to events here as well.

### @furystack/http-api

If you want to communicate with the world, this package will be your friend. You can configure the authentication, customize the routing pipeline and implement custom endpoint actions using this package.

### @furystack/odata-api

[OData](https://www.odata.org/) is a set of best practices for building and consuming RESTful APIs. You can create OData endpoints with FuryStack on a top of Data Stores easily. You can even open your endpoint in Excel :)

## Optional goodies

### @furystack/typeorm-store

This package is a physical store implementation on the top of [TypeOrm](https://typeorm.io/#/). You can easily use PostgreSQL, SQLite, MSSql or MySQL in that way.

### @furystack/auth-google

You can log in with a Google ID Token into a FuryStack backend with this simple package.

## Shades

@furystack/shades is a UI library that helps you to create web UIs easily, it works also with @furytechs tools like Logger or Inject.

## Utility packages

### @furystack/utils

A collection of useful tools like `Disposable`s with `using()` and `usingAsync()` helpers, deepMerge, Tracer and an ultra-lightweight Observer/Observable implementation

### @furystack/logging

Logging is a powerful library that allows you to create log entries with scopes, levels and custom data and process them with a logic you'd like. You can collect telemetry or create a crash dump collector.

### @furystack/inject

Inject is a DI / IOC utility that allows you to handle your dependencies easily. In short terms - Just mark your services as `Injectable()` and use `injector.getInstance(...)` to retrieve them.
An injector can be extended with _extension methods_, so you can configure your whole app in one place in a type safe way.

### @furystack/onboard

Onboard is a CLI utility to create local development environments in minutes. You can create a json manifest with a steps of cloning your services, installing dependencies, building, etc... and exec them easily - even parallelly. You can share your config from a web service (e.g. in a gist) and install an enviromnent on the fly.

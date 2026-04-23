# @furystack/core

Core package for FuryStack: physical stores, the `defineStore` token helper,
identity context primitives, and generic store tests.

## Installation

```bash
npm install @furystack/core
# or
yarn add @furystack/core
```

## Concepts

### Physical Store

In **FuryStack**, the preferred way to access data is via physical stores. A
physical store is a minimal interface that a store should implement. A store
is always bound to a collection with a specified type of entities. It can
only do basic CRUD operations (create, get by ID, filter, delete, count).
These stores should not have concepts about relations, indexes, or other
storage-specific details. Data stores don't care about permission, role, or
session checking — that is the responsibility of the DataSet layer in
`@furystack/repository`.

### `defineStore` and `StoreToken`

A `StoreToken` is a DI token that resolves to a `PhysicalStore` and carries
the store's `model` and `primaryKey` metadata. `defineStore` wraps
`defineService({ lifetime: 'singleton' })` and auto-disposes the store on
injector teardown.

```ts
import { defineStore, InMemoryStore } from '@furystack/core'

class User {
  declare username: string
  declare displayName: string
}

export const UserStore = defineStore({
  name: 'my-app/UserStore',
  model: User,
  primaryKey: 'username',
  factory: () => new InMemoryStore({ model: User, primaryKey: 'username' }),
})

const store = injector.get(UserStore)
```

Backend adapter packages ship dedicated helpers — `defineFileSystemStore`,
`defineMongoDbStore`, `defineRedisStore`, `defineSequelizeStore` — that
internally call `defineStore` and return a `StoreToken` with the right
backend factory.

### Identity Context

The generic way to implement authentication and authorization logic is with
an **Identity Context** — available on both backend and frontend. The
`IdentityContext` interface + token is exported from this package; consumers
bind an implementation that resolves the current user.

Server-side code that needs elevated privileges (password hashing, token
refresh, background jobs) uses `useSystemIdentityContext`:

```ts
import { useSystemIdentityContext } from '@furystack/core'
import { usingAsync } from '@furystack/utils'

await usingAsync(useSystemIdentityContext({ injector, username: 'background-job' }), async (systemInjector) => {
  // ...
})
```

> **Warning:** `useSystemIdentityContext` bypasses authorization. Never pass
> the returned injector to a user-facing request handler.

### User

The `User` model is a simple class that represents an application user with a
`username` and a list of `roles`. Extend it to add custom properties:

```ts
import { User } from '@furystack/core'

class MyUser extends User {
  declare email: string
  declare createdAt: Date
}
```

## Other Utilities

### Global Disposables

`globalDisposables` is a list you can fill with disposables that will be
disposed on app exit — this helps with graceful app shutdowns.

```ts
import { globalDisposables } from '@furystack/core'

globalDisposables.add(rootInjector)
```

### Generic Tests for Physical Stores

There is a set of generic store tests you can use to test your custom store
implementation:

```ts
import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'

describe('myStore', () => {
  createStoreTest({
    createStore: () => new MyStoreImplementation(TestClass, ...ctorArgs),
    typeName: 'MyStoreImplementation',
  })
})
```

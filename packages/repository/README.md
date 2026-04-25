# @furystack/repository

DataSet implementation for FuryStack. A DataSet wraps a physical store with
entity-level business logic — authorization, modification hooks, and change
events — in a structured way.

## Installation

```bash
npm install @furystack/repository
# or
yarn add @furystack/repository
```

## Setting Up a DataSet

A DataSet is declared with `defineDataSet`. It takes the underlying
`StoreToken` (from `@furystack/core` or a backend adapter) and optional
settings (authorizers, modifiers, event callbacks). The returned
`DataSetToken` is a DI token that resolves to a ready-to-use `DataSet`.

```ts
import { createInjector } from '@furystack/inject'
import { InMemoryStore, defineStore } from '@furystack/core'
import { defineDataSet, getDataSetFor } from '@furystack/repository'
import { getLogger } from '@furystack/logging'

class MyModel {
  declare id: number
  declare value: string
}

const MyStore = defineStore({
  name: 'my-app/MyStore',
  model: MyModel,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: MyModel, primaryKey: 'id' }),
})

const MyDataSet = defineDataSet({
  name: 'my-app/MyDataSet',
  store: MyStore,
  settings: {
    onEntityAdded: ({ injector, entity }) => {
      getLogger(injector).verbose({ message: `An entity was added with value '${entity.value}'` })
    },
    authorizeUpdate: async () => ({
      isAllowed: false,
      message: 'This is a read-only dataset. No update is allowed. :(',
    }),
  },
})

const myInjector = createInjector()
```

### Working with the DataSet

Resolve via `injector.get(MyDataSet)` or the convenience helper
`getDataSetFor(injector, MyDataSet)`:

```ts
const dataSet = getDataSetFor(myInjector, MyDataSet)
await dataSet.add(myInjector, { id: 1, value: 'foo' }) // <-- logs via onEntityAdded
await dataSet.update(myInjector, 1, { id: 1, value: 'bar' }) // <-- rejected by authorizeUpdate
```

### Events

Events are great for logging, monitoring DataSet changes, or distributing
changes to clients. They are optional callbacks — if defined, they are called
on a specific event. Supported events: `onEntityAdded`, `onEntityUpdated`,
`onEntityRemoved`.

### Authorizing operations

**Authorizers** are similar callbacks that return a promise with an
`AuthorizationResult`. You can allow or deny CRUD operations, or add
additional filters to collections. Supported authorizers: `authorizeAdd`,
`authorizeUpdate`, `authorizeUpdateEntity` (reloads the entity, compares with
the original), `authorizeRemove`, `authorizeRemoveEntity`, `authorizeGet`,
`authorizeGetEntity`.

### Modifiers and additional filters

`modifyOnAdd` / `modifyOnUpdate` transform entities before persisting (e.g.
fill `createdByUser` / `lastModifiedByUser`). `addFilter` injects a
pre-filter condition **before** a user-supplied filter expression is
evaluated, ensuring the caller only ever sees entities they have permission
for.

### Getting the Context

Every callback receives an `injector` — use it to resolve request-scoped
services like `HttpUserContext` to identify the caller.

### Server-side writes and the elevated IdentityContext

The DataSet is the **recommended write gateway** for all entity mutations.
Writing through the DataSet ensures that authorization rules, modification
hooks, and change events (`onEntityAdded`, `onEntityUpdated`,
`onEntityRemoved`) all fire. These events are required for features like
[entity sync](./../entity-sync-service/README.md) to work correctly.

> **Warning:** Writing directly to the underlying physical store bypasses
> the DataSet layer entirely. No authorization checks, hooks, or events
> fire, and downstream consumers (such as entity sync) will **not** be
> notified of the change. The `furystack/no-direct-store-token` lint rule
> guards against this in application code.

For server-side or background operations that don't originate from an HTTP
request (e.g. scheduled jobs, migrations, seed scripts), you won't have a
user session. Use `useSystemIdentityContext` from `@furystack/core` to
create a scoped child injector with elevated privileges:

```ts
import { useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'

await usingAsync(useSystemIdentityContext({ injector, username: 'background-job' }), async (systemInjector) => {
  const dataSet = getDataSetFor(systemInjector, MyDataSet)
  await dataSet.add(systemInjector, { value: 'created by background job' })
})
// systemInjector is disposed here -- all scoped instances cleaned up
```

> **Warning:** `useSystemIdentityContext` bypasses **all** authorization
> checks. Only use it in trusted server-side contexts. Never pass the
> returned injector to user-facing request handlers.

This pattern ensures that all writes go through the same pipeline, keeping
authorization, hooks, and event-driven features consistent regardless of
the caller.

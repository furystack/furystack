# @furystack/redis-store

Redis physical store implementation for FuryStack.

Entities are stored under namespaced keys (`${keyPrefix}:e:${id}`) with their
primary keys tracked in a per-store index Set (`${keyPrefix}:keys`); `keyPrefix`
defaults to the store name. `find()` and `count()` are supported — they load the
store's entities via the index and filter/sort/page in memory (O(store-size) per
call, so prefer `@furystack/mongodb-store` / `@furystack/sequelize-store` for
high-cardinality query workloads). `update()` is a partial read-modify-write
merge.

> **Breaking (key layout):** versions that use the namespaced layout above are
> not wire-compatible with the earlier bare-key format. Existing data written by
> an older version is not visible after upgrading.

## Installation

```bash
npm install @furystack/redis-store
# or
yarn add @furystack/redis-store
```

## Usage Example

`defineRedisStore` mints a `StoreToken` backed by a Redis client. The caller
owns the client's lifecycle — connect before binding, quit when you're done.

```ts
import { createInjector } from '@furystack/inject'
import { defineRedisStore } from '@furystack/redis-store'
import { defineDataSet } from '@furystack/repository'
import { createClient } from 'redis'

class MyModel {
  declare id: number
  declare value: string
}

const client = createClient()
await client.connect()

export const MyStore = defineRedisStore<MyModel, 'id'>({
  name: 'my-app/MyStore',
  model: MyModel,
  primaryKey: 'id',
  client,
})

export const MyDataSet = defineDataSet({
  name: 'my-app/MyDataSet',
  store: MyStore,
})

const myInjector = createInjector()
const dataSet = myInjector.get(MyDataSet)
// ... app code ...
await client.quit()
```

> **Tip:** For application-level data access, always go through a
> `DataSetToken` rather than resolving the `StoreToken` directly. The
> DataSet layer runs authorization, modification hooks, and entity-sync
> events; a direct store access skips all of them. The
> `furystack/no-direct-store-token` lint rule guards against this.

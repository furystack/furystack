# @furystack/mongodb-store

MongoDB physical store implementation for FuryStack.

## Installation

```bash
npm install @furystack/mongodb-store
# or
yarn add @furystack/mongodb-store
```

## Initialization

`defineMongoDbStore` mints a `StoreToken` backed by a MongoDB collection.
The shared `MongoClientFactory` singleton pools `MongoClient` instances by
URL and closes them when the owning injector is disposed.

```ts
import { createInjector } from '@furystack/inject'
import { defineMongoDbStore } from '@furystack/mongodb-store'
import { defineDataSet } from '@furystack/repository'

export class TestEntry {
  declare _id: string
  declare value: string
}

export const TestEntryStore = defineMongoDbStore<TestEntry, '_id'>({
  name: 'my-app/TestEntryStore',
  model: TestEntry,
  primaryKey: '_id',
  url: 'mongodb://localhost:27017',
  db: 'test',
  collection: 'TestEntries',
})

export const TestEntryDataSet = defineDataSet({
  name: 'my-app/TestEntryDataSet',
  store: TestEntryStore,
})

const myInjector = createInjector()
const dataSet = myInjector.get(TestEntryDataSet)
```

> **Tip:** For application-level data access, always go through a
> `DataSetToken` rather than resolving the `StoreToken` directly. The
> DataSet layer runs authorization, modification hooks, and entity-sync
> events; a direct store access skips all of them. The
> `furystack/no-direct-store-token` lint rule guards against this.

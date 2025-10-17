# mongodb-store

MongoDB physical store implementation for FuryStack.

## Initialization

```ts
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { useMongoDb } from '@furystack/mongodb-store'

export class TestEntry {
  declare _id: string
  declare value: string
}

const myInjector = new Injector()
useMongoDb({
  injector: myInjector,
  model: TestEntry,
  primaryKey: '_id',
  url: 'mongodb://localhost:27017',
  db: 'test',
  collection: 'TestEntries',
})

const myMongoStore = myInjector.getInstance(StoreManager).getStoreFor(TestEntry, '_id')
```

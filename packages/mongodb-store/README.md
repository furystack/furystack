# mongodb-store

MongoDB Physical Store implementation for FuryStack.

Initialization

```ts

import '@furystack/mongodb-store'

export class TestEntry {
  public _id!: string
  public value!: string
}

myInjector
  .setupStores(sm => {
    sm.useMongoDb(TestEntry, 'mongodb://localhost:27017', 'test', 'TestEntries')

const myMongoStore = myInjector.getInstance(StoreManager).getStoreFor(TestEntry)
```

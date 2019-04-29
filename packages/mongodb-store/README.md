# mongodb-store

MongoDB Physical Store implementation for FuryStack.

Initialization

```ts

import '@furystack/mongodb-store'

export class TestEntry {
  // tslint:disable-next-line: naming-convention
  public _id!: string
  public value!: string
}

myInjector
  .useLogging(ConsoleLogger)
  .setupStores(sm => {
    sm.useMongoDb(TestEntry, 'mongodb://localhost:27017', 'test', 'TestEntries')


const myStore: IPhysicalStore<TestEntry> = myInjector.getInstance(StoreManager).getStoreFor(TestEntry)

```

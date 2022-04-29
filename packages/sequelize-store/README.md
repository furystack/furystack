# mongodb-store

Sequelize Physical Store implementation for FuryStack.

Initialization

```ts

import '@furystack/sequelize-store'

export class TestEntry extends Model<...,...> {
  public _id!: string
  public value!: string
}

myInjector
  .setupStores(sm => {
    sm.useSequelize(TestEntry, '...other Sequelize-related options...')


const myStore: IPhysicalStore<TestEntry> = myInjector.getInstance(StoreManager).getStoreFor(TestEntry)

```

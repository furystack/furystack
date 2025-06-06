# sequelize-store

Sequelize physical store implementation for FuryStack.

## Initialization

```ts
import '@furystack/sequelize-store'

export class TestEntry extends Model<...,...> {
  public declare _id: string
  public declare value: string
}

myInjector
  .setupStores(sm => {
    sm.useSequelize(TestEntry, '...other Sequelize-related options...')
  })

const myStore: IPhysicalStore<TestEntry> = myInjector.getInstance(StoreManager).getStoreFor(TestEntry)
```

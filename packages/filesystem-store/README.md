# filesystem-store

Filesystem Store implementation for FuryStack. Recommended for lightweight usage, embedded operations, experimenting / tryout, not for production.

An usage example:

```ts
import { join } from 'path'
import { Injector } from '@furystack/inject'
import '@furystack/filesystem-store'
import { PhysicalStore, StoreManager } from '@furystack/core'

class MyModel {
  public id!: number
  public value!: string
}

const myInjector = new Injector()
myInjector
  .setupStores((stores) => stores.useFileSystem({ model: MyModel, primaryKey: 'id', fileName: 'example.json' }))

const myStore = myInjector.getInstance(StoreManager).getStoreFor(MyModel)
await myStore.add({ id: 1, value: 'foo' })
```

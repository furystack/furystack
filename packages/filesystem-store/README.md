# filesystem-store

Filesystem store implementation for FuryStack. Recommended for lightweight usage, embedded operations, and experimenting/tryouts—not for production.

Usage example:

```ts
import { join } from 'path'
import { Injector } from '@furystack/inject'
import '@furystack/filesystem-store'
import { PhysicalStore, StoreManager } from '@furystack/core'

class MyModel {
  declare id: number
  declare value: string
}

const myInjector = new Injector()
myInjector.setupStores((stores) => stores.useFileSystem({ model: MyModel, primaryKey: 'id', fileName: 'example.json' }))

const myStore = myInjector.getInstance(StoreManager).getStoreFor(MyModel)
await myStore.add({ id: 1, value: 'foo' })
```

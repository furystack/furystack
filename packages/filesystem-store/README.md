# filesystem-store

Filesystem store implementation for FuryStack. Recommended for lightweight usage, embedded operations, and experimenting/tryouts—not for production.

Usage example:

```ts
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { useFileSystemStore } from '@furystack/filesystem-store'

class MyModel {
  declare id: number
  declare value: string
}

const myInjector = new Injector()
useFileSystemStore({
  injector: myInjector,
  model: MyModel,
  primaryKey: 'id',
  fileName: 'example.json',
})

const myStore = myInjector.getInstance(StoreManager).getStoreFor(MyModel, 'id')
await myStore.add({ id: 1, value: 'foo' })
```

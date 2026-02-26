# @furystack/filesystem-store

Filesystem store implementation for FuryStack. Recommended for lightweight usage, embedded operations, and experimenting/tryouts—not for production.

## Installation

```bash
npm install @furystack/filesystem-store
# or
yarn add @furystack/filesystem-store
```

## Usage Example

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

> **Tip:** For application-level data access, wrap the physical store with a Repository DataSet using `getRepository(injector).createDataSet(Model, 'primaryKey')` and then use `getDataSetFor(injector, Model, 'primaryKey')` from `@furystack/repository`. This ensures authorization, hooks, and entity sync events are properly triggered.

# @furystack/filesystem-store

Filesystem store implementation for FuryStack. Recommended for lightweight usage, embedded operations, and experimenting/tryouts — not for production.

## Installation

```bash
npm install @furystack/filesystem-store
# or
yarn add @furystack/filesystem-store
```

## Usage Example

`defineFileSystemStore` mints a `StoreToken` that resolves to a
`FileSystemStore`. Declare the token at module scope and bind your DataSet
to it via `defineDataSet`.

```ts
import { createInjector } from '@furystack/inject'
import { defineFileSystemStore } from '@furystack/filesystem-store'
import { defineDataSet } from '@furystack/repository'

class MyModel {
  declare id: number
  declare value: string
}

export const MyStore = defineFileSystemStore<MyModel, 'id'>({
  name: 'my-app/MyStore',
  model: MyModel,
  primaryKey: 'id',
  fileName: 'example.json',
})

export const MyDataSet = defineDataSet({
  name: 'my-app/MyDataSet',
  store: MyStore,
})

const myInjector = createInjector()
const dataSet = myInjector.get(MyDataSet)
await dataSet.add(myInjector, { id: 1, value: 'foo' })
```

> **Tip:** For application-level data access, always go through a
> `DataSetToken` (as above) rather than resolving the `StoreToken`
> directly. The DataSet layer runs authorization, modification hooks, and
> entity-sync events; a direct store access skips all of them. The
> `furystack/no-direct-store-token` lint rule guards against this.

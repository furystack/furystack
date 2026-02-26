# @furystack/redis-store

Redis physical store implementation for FuryStack. `filter()` and `count()` are not supported.

## Installation

```bash
npm install @furystack/redis-store
# or
yarn add @furystack/redis-store
```

## Usage Example

```ts
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { useRedis } from '@furystack/redis-store'
import { createClient } from 'redis'

class MyModel {
  declare id: number
  declare value: string
}

const myInjector = new Injector()
useRedis({
  injector: myInjector,
  model: MyModel,
  primaryKey: 'id',
  client: createClient(),
})

const myStore = myInjector.getInstance(StoreManager).getStoreFor(MyModel, 'id')
```

> **Tip:** For application-level data access, wrap the physical store with a Repository DataSet using `getRepository(injector).createDataSet(Model, 'primaryKey')` and then use `getDataSetFor(injector, Model, 'primaryKey')` from `@furystack/repository`. This ensures authorization, hooks, and entity sync events are properly triggered.

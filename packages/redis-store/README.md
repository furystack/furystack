# redis-store

Redis physical store implementation for FuryStack. `filter()` and `count()` are not supported.

Usage example:

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

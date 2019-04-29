# redis-store

Redis Physical Store implementation for FuryStack. `filter()` and `count()` is not supported at the moment.

An usage example:

```ts
import { join } from 'path'
import { Injector } from '@furystack/inject'
import '@furystack/redis-store'
import { createClient } from 'redis'
import { IPhysicalStore, StoreManager } from '@furystack/core'

class MyModel {
  public id!: number
  public value!: string
}

const myInjector = new Injector()
myInjector.useLogging().setupStores(stores => stores.useRedis(MyModel, 'id', createClient()))

const myStore: IPhysicalStore<MyModel> = myInjector.getInstance(StoreManager).getStoreFor(MyModel)
```

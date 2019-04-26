# typeorm-store

TypeORM Physical Store implementation for FuryStack. You can use TypeORM stores as IPhysicalStores for FuryStack

An usage example:

```ts
import { join } from 'path'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Injector } from '@furystack/inject'
import '@furystack/typeorm-store'
import { IPhysicalStore, StoreManager } from '@furystack/core'

@Entity()
class MyModel {
  @PrimaryGeneratedColumn()
  public id!: number

  @Column()
  public value!: string
}

const myInjector = new Injector()
myInjector
  .useLogging()
  .useTypeOrm({
    name: 'ExampleDb',
    type: 'sqlite', // you have to install the sqlite package as well
    database: join(process.cwd(), 'data', 'users.sqlite'),
    entities: [MyModel],
    synchronize: true,
  })
  .setupStores(stores => stores.useTypeOrmStore(MyModel))

const myStore: IPhysicalStore<MyModel> = myInjector.getInstance(StoreManager).getStoreFor(MyModel)
```

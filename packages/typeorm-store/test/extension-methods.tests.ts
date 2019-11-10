import { Injector } from '@furystack/inject'
import '@furystack/logging'
import { using, usingAsync } from '@furystack/utils'
import '../src'
import { ConnectionManager, Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

describe('TypeORM Extension Methods', () => {
  it('Can be initialized from an extension method', async () => {
    await usingAsync(new Injector(), async i => {
      i.useLogging().useTypeOrm({
        type: 'sqlite',
        database: ':memory:',
        dropSchema: true,
        entities: [],
        synchronize: true,
        logging: false,
      })
      await i.getInstance(ConnectionManager).connections[0].awaitConnection()
    })
  })

  it('Can add stores to StoreManager with an extension method', () => {
    using(new Injector(), i => {
      @Entity()
      class Example {
        @PrimaryGeneratedColumn()
        id!: number
        @Column()
        value!: string
      }

      i.useLogging()
        .useTypeOrm({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [Example],
          synchronize: true,
          logging: false,
        })
        .setupStores(stores => stores.useTypeOrmStore(Example))
    })
  })
})

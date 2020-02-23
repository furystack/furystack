import { Injector } from '@furystack/inject'
import { Entity, PrimaryGeneratedColumn, Column, Repository } from 'typeorm'
import { StoreManager, PhysicalStore } from '@furystack/core'
import { TypeOrmStore } from '../src'
import './injector-extensions'
import './store-manager-extensions'
import '@furystack/logging'

@Entity()
class MockEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  value!: string
}

const existing1: MockEntity = {
  id: 1,
  value: 'existing1',
}

const existing2: MockEntity = {
  id: 2,
  value: 'existing2',
}

const newEntity: MockEntity = {
  id: 2,
  value: 'newEntity',
}

describe('TypeORM Store', () => {
  let injector!: Injector
  let store!: PhysicalStore<MockEntity>
  beforeEach(async () => {
    injector = new Injector()
      .useLogging()
      .useTypeOrm({
        type: 'sqlite',
        database: ':memory:',
        dropSchema: true,
        entities: [MockEntity],
        synchronize: true,
        logging: false,
      })
      .setupStores(sm => sm.useTypeOrmStore(MockEntity))

    store = injector.getInstance(StoreManager).getStoreFor(MockEntity)
    await store.add(existing1)
    await store.add(existing2)
  })

  afterEach(async () => {
    await injector.dispose()
  })

  it('Should retrieve an entity by ID', async () => {
    const retrieved = await store.get(1)
    expect(retrieved).toEqual(existing1)
  })

  it('Should count entities', async () => {
    const count = await store.count()
    expect(count).toBe(2)
  })
  it('Should count entities with filter', async () => {
    const count = await store.count({ id: 2 })
    expect(count).toBe(1)
  })

  it('Should search entities', async () => {
    const entities = await store.search({})
    expect(entities.length).toBe(2)
    expect(entities).toEqual([existing1, existing2])
  })

  it('Should search with top', async () => {
    const entities = await store.search({ top: 1 })
    expect(entities.length).toBe(1)
    expect(entities).toEqual([existing1])
  })

  it('Should search with skip', async () => {
    const entities = await store.search({ skip: 1 })
    expect(entities.length).toBe(1)
    expect(entities).toEqual([existing2])
  })

  it('Should add entries', async () => {
    await store.add(newEntity)
    const retrieved = await store.get(newEntity.id)
    expect(retrieved).toEqual(newEntity)
  })

  it('Should update an entity', async () => {
    await store.update(existing1.id, { ...existing1, value: 'updated' })
    const retrieved = await store.get(existing1.id)
    expect(retrieved).toEqual({ ...existing1, value: 'updated' })
  })

  it('Should remove an entity', async () => {
    await store.remove(existing1.id)
    const entities = await store.search({})
    expect(entities).not.toContain(existing1)
  })

  it('Should retrieve the TypeORM Repository', async () => {
    const repo = await (store as TypeOrmStore<MockEntity>).getTypeormRepository()
    expect(repo).toBeInstanceOf(Repository)
  })
})

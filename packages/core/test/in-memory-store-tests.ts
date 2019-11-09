import '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { InMemoryStore } from '../src/InMemoryStore'

class MockClass {
  public id!: number
  public value!: string
}

describe('InMemoryStore', () => {
  let f!: InMemoryStore<MockClass>

  beforeEach(() => {
    f = new InMemoryStore({ model: MockClass, primaryKey: 'id' })
  })

  afterEach(() => {
    f.dispose()
  })

  it('should be constructed with default parameters', () => {
    const f2 = new InMemoryStore({ model: MockClass, primaryKey: 'id' })
    expect(f2).toBeInstanceOf(InMemoryStore)
  })

  it('should be able to add a value', async () => {
    await f.add({ id: 1, value: 'asd' })
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('adding a duplicated value should throw', async () => {
    await f.add({ id: 1, value: 'asd' })
    try {
      await f.add({ id: 1, value: 'asd' })
      throw Error('Should throw an error')
    } catch (error) {
      expect(error.message).toBe('Item with the primary key already exists.')
    }
  })

  it('should be able to remove a value', async () => {
    await f.add({ id: 1, value: 'asd' })
    await f.remove(1)
    const count = await f.count()
    expect(count).toBe(0)
  })

  it('Update should set a value', async () => {
    await f.update(1, { id: 1, value: 'asd' })
    const count = await f.count()
    expect(count).toBe(1)
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('Should restrict hits with the Count value', async () => {
    await f.add({ id: 1, value: 'asd' })
    await f.add({ id: 2, value: 'asd' })
    await f.add({ id: 3, value: 'alma' })

    const asdCount = await f.count({ value: 'asd' })
    expect(asdCount).toBe(2)

    const almaCount = await f.count({ value: 'alma' })
    expect(almaCount).toBe(1)

    const nullCount = await f.count({ value: 'null' })
    expect(nullCount).toBe(0)
  })

  it('filter should return the corresponding entries', async () => {
    f.update(1, { id: 1, value: 'asd' })
    f.update(2, { id: 2, value: 'def' })
    f.update(3, { id: 3, value: 'def' })

    const result = await f.search({ filter: { value: 'def' } })
    expect(result.length).toBe(2)
  })

  it('Should return partial and full result', async () => {
    class ExampleClass {
      public id = 1
      public value = ''
      public notNeeded = false
    }
    await usingAsync(new InMemoryStore({ model: ExampleClass, primaryKey: 'id' }), async i => {
      await i.add({ id: 1, value: 'alma', notNeeded: true })

      const partialResult = await i.search({
        filter: { id: 1 },
        select: ['id', 'value'],
      })
      // Type check should also warn!
      expect(partialResult[0].id).toBeTruthy()
      expect((partialResult[0] as any)['notNeeded']).toBeUndefined()

      const fullResult = await i.search({ filter: { id: 1 } })
      expect(fullResult[0].notNeeded).toBeTruthy()
    })
  })

  it('Should order values', async () => {
    class ExampleClass {
      public id = 1
      public orderableValue1 = 1
      public orderableValue2 = 1
    }

    await usingAsync(new InMemoryStore({ model: ExampleClass, primaryKey: 'id' }), async store => {
      for (let i = 0; i < 10; i++) {
        await store.add({ id: i, orderableValue1: Math.random(), orderableValue2: Math.random() })
      }

      // For equality
      await store.add({ id: 20, orderableValue1: 0, orderableValue2: 0 })
      await store.add({ id: 21, orderableValue1: 0, orderableValue2: 0 })

      const orderByValue1Asc = await store.search({ order: { orderableValue1: 'ASC' } })
      let min = 0
      for (const currentValue of orderByValue1Asc) {
        if (min > currentValue.orderableValue1) {
          throw Error('Order failed!')
        }
        min = currentValue.orderableValue1
      }

      const orderByValue1Desc = await store.search({ order: { orderableValue1: 'DESC' } })
      let max = Number.MAX_SAFE_INTEGER
      for (const currentValue of orderByValue1Desc) {
        if (max < currentValue.orderableValue1) {
          throw Error('Order failed!')
        }
        max = currentValue.orderableValue1
      }
    })
  })

  it('Should respect top and skip', async () => {
    class ExampleClass {
      public id = 1
    }

    await usingAsync(new InMemoryStore({ model: ExampleClass, primaryKey: 'id' }), async store => {
      for (let i = 0; i < 10; i++) {
        await store.add({ id: i })
      }
      const zeroToThree = await store.search({ top: 4 })
      expect(zeroToThree).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }])

      const fiveToEight = await store.search({ skip: 5, top: 4 })
      expect(fiveToEight).toEqual([{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }])

      const eightNine = await store.search({ skip: 8 })
      expect(eightNine).toEqual([{ id: 8 }, { id: 9 }])
    })
  })

  it('dispose should empty the cache', async () => {
    await f.add({ id: 1, value: 'asd' })
    f.dispose()
    const count = await f.count()
    expect(count).toBe(0)
  })
})

import { usingAsync } from '@sensenet/client-utils'
import { InMemoryStore } from '../src/InMemoryStore'
import { PhysicalStore } from '../src/Models/PhysicalStore'

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

  it('filter should return the corresponding entries', async () => {
    f.update(1, { id: 1, value: 'asd' })
    f.update(2, { id: 2, value: 'def' })
    f.update(3, { id: 3, value: 'def' })

    const result = await f.search({ filter: { value: 'def' } })
    expect(result.length).toBe(2)
  })

  it('Should return partial and full result', async () => {
    class ExampleClass {
      public id: number = 1
      public value: string = ''
      public notNeeded: boolean = false
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

  it('dispose should empty the cache', async () => {
    await f.add({ id: 1, value: 'asd' })
    f.dispose()
    const count = await f.count()
    expect(count).toBe(0)
  })
})

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

  it('should be constructed with default parameters', () => {
    const f2 = new InMemoryStore({ model: MockClass, primaryKey: 'id' })
    expect(f2).toBeInstanceOf(InMemoryStore)
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

    const result = await f.filter({ filter: { value: 'def' } })
    expect(result.length).toBe(2)
  })
})

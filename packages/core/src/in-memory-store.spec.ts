import '@furystack/logging'
import { InMemoryStore } from './in-memory-store'
import { TestClass, createStoreTest, createMockEntity } from './create-physical-store-tests'

describe('InMemoryStore', () => {
  const createStore = () => new InMemoryStore({ model: TestClass, primaryKey: 'id' })

  createStoreTest({
    createStore,
    typeName: 'InMemoryStore',
  })

  it('dispose should empty the cache', async () => {
    const f = createStore()
    await f.add(createMockEntity())
    f.dispose()
    const count = await f.count()
    expect(count).toBe(0)
  })
})

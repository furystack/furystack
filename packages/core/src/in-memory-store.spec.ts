import { InMemoryStore } from './in-memory-store.js'
import { createStoreTest, createMockEntity } from './create-physical-store-tests.js'
import { describe, expect, it } from 'vitest'
import { TestClass } from './test-class.js'

describe('InMemoryStore', () => {
  const createStore = () => new InMemoryStore({ model: TestClass, primaryKey: 'id' })

  createStoreTest({
    createStore,
    typeName: 'InMemoryStore',
    // skipAdvancedTests: true, // TODO
  })

  it('dispose should empty the cache', async () => {
    const f = createStore()
    await f.add(createMockEntity())
    f.dispose()
    const count = await f.count()
    expect(count).toBe(0)
  })
})

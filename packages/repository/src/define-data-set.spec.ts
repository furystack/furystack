import { defineStore, InMemoryStore } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { DataSet } from './data-set.js'
import { defineDataSet } from './define-data-set.js'

class Test {
  declare id: number
  declare value: string
}

// Store tokens are declared at module scope so TypeScript keeps the literal
// primary-key narrowing. Wrapping `defineStore` in an arrow function would
// widen the inferred `TPrimaryKey` back to `keyof Test` in the return type.
const BasicStore = defineStore({
  name: 'test/BasicStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const SingletonStore = defineStore({
  name: 'test/SingletonStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const MetaStore = defineStore({
  name: 'test/MetaStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const HooksStore = defineStore({
  name: 'test/HooksStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const EventsStore = defineStore({
  name: 'test/EventsStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const DisposeStore = defineStore({
  name: 'test/DisposeStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})
const RebindStore = defineStore({
  name: 'test/RebindStore',
  model: Test,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
})

const modifyOnAddSpy = vi.fn()
const BasicDataSet = defineDataSet({ name: 'test/BasicDataSet', store: BasicStore })
const SingletonDataSet = defineDataSet({ name: 'test/SingletonDataSet', store: SingletonStore })
const MetaDataSet = defineDataSet({ name: 'test/MetaDataSet', store: MetaStore })
// The `settings` callback participates in bidirectional inference against the
// surrounding generics. Even with `NoInfer` on the settings position, inline
// callbacks currently widen `TPrimaryKey` to `keyof T` because TypeScript has
// to contextually type the callback before it can commit to the store-driven
// inference. The runtime value of `token.primaryKey` is still correct; only
// the entity parameter is typed as the wider `WithOptionalId<Test, keyof Test>`.
// The non-null assertion on `entity.value` reflects that widening.
const HooksDataSet = defineDataSet({
  name: 'test/HooksDataSet',
  store: HooksStore,
  settings: {
    modifyOnAdd: async ({ entity }) => {
      modifyOnAddSpy()
      return { ...entity, value: entity.value!.toUpperCase() }
    },
  },
})
const EventsDataSet = defineDataSet({ name: 'test/EventsDataSet', store: EventsStore })
const DisposeDataSet = defineDataSet({ name: 'test/DisposeDataSet', store: DisposeStore })
const RebindDataSet = defineDataSet({ name: 'test/RebindDataSet', store: RebindStore })

describe('defineDataSet', () => {
  it('resolves to a DataSet backed by the supplied store', async () => {
    await usingAsync(createInjector(), async (i) => {
      const ds = i.get(BasicDataSet)
      expect(ds).toBeInstanceOf(DataSet)
      expect(ds.settings.physicalStore).toBe(i.get(BasicStore))
    })
  })

  it('caches the DataSet as a singleton across resolutions', async () => {
    await usingAsync(createInjector(), async (i) => {
      expect(i.get(SingletonDataSet)).toBe(i.get(SingletonDataSet))
    })
  })

  it('mirrors the model and primary key from the backing store token', () => {
    expect(MetaDataSet.model).toBe(Test)
    expect(MetaDataSet.primaryKey).toBe('id')
  })

  it('applies the configured authorizers and hooks', async () => {
    modifyOnAddSpy.mockClear()
    await usingAsync(createInjector(), async (i) => {
      const ds = i.get(HooksDataSet)
      await ds.add(i, { id: 1, value: 'asd' })
      const stored = await ds.get(i, 1)
      expect(modifyOnAddSpy).toHaveBeenCalledTimes(1)
      expect(stored?.value).toBe('ASD')
    })
  })

  it('emits change events through the DataSet EventHub', async () => {
    await usingAsync(createInjector(), async (i) => {
      const added = vi.fn()
      const ds = i.get(EventsDataSet)
      ds.addListener('onEntityAdded', added)
      await ds.add(i, { id: 1, value: 'x' })
      expect(added).toHaveBeenCalledWith(expect.objectContaining({ entity: { id: 1, value: 'x' } }))
    })
  })

  it('clears DataSet listeners when the injector is disposed', async () => {
    const i = createInjector()
    const ds = i.get(DisposeDataSet)
    const listener = vi.fn()
    ds.addListener('onEntityAdded', listener)
    await i[Symbol.asyncDispose]()
    // After disposal the DataSet's event subscriptions are cleared;
    // emitting directly would be a no-op.
    ds.emit('onEntityAdded', { injector: i, entity: { id: 1, value: 'x' } })
    expect(listener).not.toHaveBeenCalled()
  })

  it('allows rebinding the backing store for tests', async () => {
    await usingAsync(createInjector(), async (i) => {
      const replacement = new InMemoryStore({ model: Test, primaryKey: 'id' })
      i.bind(RebindStore, () => replacement)
      const ds = i.get(RebindDataSet)
      expect(ds.settings.physicalStore).toBe(replacement)
    })
  })
})

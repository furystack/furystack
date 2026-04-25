import type { StoreToken, WithOptionalId } from '@furystack/core'
import { AuthorizationError, defineStore, InMemoryStore } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { AuthorizationResult, DataSetSettings } from './data-set-setting.js'
import type { DataSet } from './data-set.js'
import { defineDataSet, type DefineDataSetSettings } from './define-data-set.js'
import { getDataSetFor } from './helpers.js'

class TestClass {
  declare id: number
  declare value: string
}

// Token declared at module scope so TypeScript preserves the literal primary
// key. The explicit `StoreToken<TestClass, 'id'>` annotation keeps
// `TPrimaryKey` narrow when the token is later passed to `defineDataSet`;
// inferred return types from `defineStore` tend to widen back to
// `keyof TestClass` in downstream inference contexts.
const TestStore: StoreToken<TestClass, 'id'> = defineStore({
  name: 'test/DataSetSpecStore',
  model: TestClass,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: TestClass, primaryKey: 'id' }),
})

/**
 * Builds a fresh injector with a disposable {@link InMemoryStore} bound as the
 * backing store for a {@link TestClass} dataset. Each call mints a new
 * dataset token so the injector cache starts from scratch for every test.
 */
const withDataSet = async (
  settings: DefineDataSetSettings<TestClass, 'id'> | undefined,
  fn: (ctx: { i: Injector; dataSet: DataSet<TestClass, 'id'> }) => Promise<void>,
): Promise<void> => {
  const TestDataSet = defineDataSet<TestClass, 'id', WithOptionalId<TestClass, 'id'>>({
    name: `test/DataSet-${Math.random()}`,
    store: TestStore,
    settings,
  })
  await usingAsync(createInjector(), async (i) => {
    const dataSet = getDataSetFor(i, TestDataSet)
    await fn({ i, dataSet })
  })
}

describe('DataSet', () => {
  describe('Authorizers', () => {
    describe('Add', () => {
      it('adds an entity when no settings are provided', async () => {
        await withDataSet(undefined, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(result?.value).toBe('asd')
        })
      })

      it('runs authorizeAdd and persists the entity on pass', async () => {
        const authorizeAdd = vi.fn(async () => ({ isAllowed: true }) as AuthorizationResult)
        await withDataSet({ authorizeAdd }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(authorizeAdd).toHaveBeenCalled()
          expect((await dataSet.get(i, 1))?.value).toBe('asd')
        })
      })

      it('throws and does not persist when authorizeAdd fails', async () => {
        const authorizeAdd = vi.fn(async () => ({ isAllowed: false, message: '...' }) as AuthorizationResult)
        await withDataSet({ authorizeAdd }, async ({ i, dataSet }) => {
          await expect(dataSet.add(i, { id: 1, value: 'asd' })).rejects.toBeInstanceOf(AuthorizationError)
          expect(authorizeAdd).toHaveBeenCalled()
          expect(await dataSet.get(i, 1)).toBeUndefined()
        })
      })

      it('applies modifyOnAdd before persisting', async () => {
        const modifyOnAdd = vi.fn<NonNullable<DataSetSettings<TestClass, 'id'>['modifyOnAdd']>>(async ({ entity }) => ({
          ...entity,
          value: entity.value.toUpperCase(),
        }))
        await withDataSet({ modifyOnAdd }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(modifyOnAdd).toHaveBeenCalled()
          expect(result?.value).toBe('ASD')
        })
      })

      it('emits onEntityAdded after a successful add', async () => {
        await withDataSet(undefined, async ({ i, dataSet }) => {
          const listener = vi.fn()
          dataSet.addListener('onEntityAdded', listener)
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(listener).toHaveBeenCalledWith(expect.objectContaining({ entity: { id: 1, value: 'asd' } }))
        })
      })
    })

    describe('Update', () => {
      it('updates an entity when no settings are provided', async () => {
        await withDataSet(undefined, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect((await dataSet.get(i, 1))?.value).toBe('asd2')
        })
      })

      it('runs authorizeUpdate and persists on pass', async () => {
        const authorizeUpdate = vi.fn(async () => ({ isAllowed: true }) as AuthorizationResult)
        await withDataSet({ authorizeUpdate }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdate).toHaveBeenCalled()
          expect((await dataSet.get(i, 1))?.value).toBe('asd2')
        })
      })

      it('throws when authorizeUpdate fails and leaves the entity untouched', async () => {
        const authorizeUpdate = vi.fn(async () => ({ isAllowed: false, message: '...' }) as AuthorizationResult)
        await withDataSet({ authorizeUpdate }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await expect(dataSet.update(i, 1, { id: 1, value: 'asd2' })).rejects.toBeInstanceOf(AuthorizationError)
          expect((await dataSet.get(i, 1))?.value).toBe('asd')
        })
      })

      it('runs authorizeUpdateEntity against the loaded entity and persists on pass', async () => {
        const authorizeUpdateEntity = vi.fn(async () => ({ isAllowed: true }) as AuthorizationResult)
        await withDataSet({ authorizeUpdateEntity }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdateEntity).toHaveBeenCalled()
          expect((await dataSet.get(i, 1))?.value).toBe('asd2')
        })
      })

      it('throws and leaves the entity untouched when authorizeUpdateEntity fails', async () => {
        const authorizeUpdateEntity = vi.fn(async () => ({ isAllowed: false, message: '...' }) as AuthorizationResult)
        await withDataSet({ authorizeUpdateEntity }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await expect(dataSet.update(i, 1, { id: 1, value: 'asd2' })).rejects.toBeInstanceOf(AuthorizationError)
          expect((await dataSet.get(i, 1))?.value).toBe('asd')
        })
      })

      it('applies modifyOnUpdate before persisting', async () => {
        const modifyOnUpdate = vi.fn<NonNullable<DataSetSettings<TestClass, 'id'>['modifyOnUpdate']>>(
          async ({ entity }) => ({
            ...entity,
            value: entity.value?.toUpperCase() ?? '',
          }),
        )
        await withDataSet({ modifyOnUpdate }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(modifyOnUpdate).toHaveBeenCalled()
          expect((await dataSet.get(i, 1))?.value).toBe('ASD2')
        })
      })

      it('emits onEntityUpdated with the applied change', async () => {
        await withDataSet(undefined, async ({ i, dataSet }) => {
          const listener = vi.fn()
          dataSet.addListener('onEntityUpdated', listener)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(listener).toHaveBeenCalledWith(expect.objectContaining({ change: { id: 1, value: 'asd2' }, id: 1 }))
        })
      })
    })

    describe('Count', () => {
      it('returns the count when no settings are provided', async () => {
        await withDataSet(undefined, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(await dataSet.count(i)).toBe(1)
        })
      })

      it('returns the count when authorizeGet passes', async () => {
        const authorizeGet = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
        await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(await dataSet.count(i)).toBe(1)
        })
      })

      it('throws when authorizeGet fails', async () => {
        const authorizeGet = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
        await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
          await dataSet.add(i, { id: 1, value: 'asd' })
          await expect(dataSet.count(i)).rejects.toBeInstanceOf(AuthorizationError)
        })
      })
    })
  })

  describe('filter', () => {
    it('returns the unfiltered result when no settings are provided', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        expect((await dataSet.find(i, {})).length).toBe(1)
      })
    })

    it('returns the unfiltered result when authorizeGet passes', async () => {
      const authorizeGet = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        expect((await dataSet.find(i, {})).length).toBe(1)
      })
    })

    it('throws when authorizeGet fails', async () => {
      const authorizeGet = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
      await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await expect(dataSet.find(i, {})).rejects.toBeInstanceOf(AuthorizationError)
      })
    })
  })

  describe('get', () => {
    it('returns the entity when no settings are provided', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        expect((await dataSet.get(i, 1))?.id).toBe(1)
      })
    })

    it('returns the entity when authorizeGet passes', async () => {
      const authorizeGet = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        expect((await dataSet.get(i, 1))?.id).toBe(1)
      })
    })

    it('throws when authorizeGet fails', async () => {
      const authorizeGet = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
      await withDataSet({ authorizeGet }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await expect(dataSet.get(i, 1)).rejects.toBeInstanceOf(AuthorizationError)
      })
    })

    it('returns the entity when authorizeGetEntity passes', async () => {
      const authorizeGetEntity = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeGetEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        expect((await dataSet.get(i, 1))?.id).toBe(1)
      })
    })

    it('throws when authorizeGetEntity fails', async () => {
      const authorizeGetEntity = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
      await withDataSet({ authorizeGetEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await expect(dataSet.get(i, 1)).rejects.toBeInstanceOf(AuthorizationError)
      })
    })

    it('receives the full entity in authorizeGetEntity even when select is used', async () => {
      const authorizeGetEntity = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeGetEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1, ['value'])
        expect(authorizeGetEntity).toHaveBeenCalledTimes(1)
        const firstCall = authorizeGetEntity.mock.calls[0] as unknown as [{ entity: TestClass }]
        expect(firstCall[0].entity).toEqual({ id: 1, value: 'asd' })
        expect(result).toEqual({ value: 'asd' })
        expect(result).not.toHaveProperty('id')
      })
    })

    it('returns undefined without calling authorizeGetEntity when the entity does not exist', async () => {
      const authorizeGetEntity = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeGetEntity }, async ({ i, dataSet }) => {
        const result = await dataSet.get(i, 999)
        expect(result).toBeUndefined()
        expect(authorizeGetEntity).not.toHaveBeenCalled()
      })
    })
  })

  describe('remove', () => {
    it('removes the entity when no settings are provided', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        expect(await dataSet.count(i)).toBe(0)
      })
    })

    it('removes the entity when authorizeRemove passes', async () => {
      const authorizeRemove = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeRemove }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        expect(await dataSet.count(i)).toBe(0)
      })
    })

    it('throws and preserves the entity when authorizeRemove fails', async () => {
      const authorizeRemove = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
      await withDataSet({ authorizeRemove }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await expect(dataSet.remove(i, 1)).rejects.toBeInstanceOf(AuthorizationError)
        expect(await dataSet.count(i)).toBe(1)
      })
    })

    it('removes the entity when authorizeRemoveEntity passes', async () => {
      const authorizeRemoveEntity = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeRemoveEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        expect(await dataSet.count(i)).toBe(0)
      })
    })

    it('throws and preserves the entity when authorizeRemoveEntity fails', async () => {
      const authorizeRemoveEntity = vi.fn(async () => ({ isAllowed: false, message: ':(' }) as AuthorizationResult)
      await withDataSet({ authorizeRemoveEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'asd' })
        await expect(dataSet.remove(i, 1)).rejects.toBeInstanceOf(AuthorizationError)
        expect(await dataSet.count(i)).toBe(1)
      })
    })

    it('emits onEntityRemoved after a successful remove', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        const listener = vi.fn()
        dataSet.addListener('onEntityRemoved', listener)
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ key: 1 }))
      })
    })

    it('removes multiple entities at once', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'a' }, { id: 2, value: 'b' }, { id: 3, value: 'c' })
        await dataSet.remove(i, 1, 3)
        expect(await dataSet.count(i)).toBe(1)
        expect((await dataSet.get(i, 2))?.value).toBe('b')
      })
    })

    it('emits onEntityRemoved for each removed key', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        const removedKeys: number[] = []
        dataSet.addListener('onEntityRemoved', ({ key }) => {
          removedKeys.push(key)
        })
        await dataSet.add(i, { id: 1, value: 'a' }, { id: 2, value: 'b' })
        await dataSet.remove(i, 1, 2)
        expect(removedKeys).toEqual([1, 2])
      })
    })

    it('authorizes each entity when authorizeRemoveEntity is set', async () => {
      const authorizeRemoveEntity = vi.fn(async () => ({ isAllowed: true, message: '' }) as AuthorizationResult)
      await withDataSet({ authorizeRemoveEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'a' }, { id: 2, value: 'b' })
        await dataSet.remove(i, 1, 2)
        expect(authorizeRemoveEntity).toHaveBeenCalledTimes(2)
        expect(await dataSet.count(i)).toBe(0)
      })
    })

    it('does not remove anything when authorizeRemoveEntity fails for one entity (all-or-nothing)', async () => {
      const authorizeRemoveEntity = vi.fn(async ({ entity }: { entity: TestClass }) => {
        if (entity.id === 2) {
          return { isAllowed: false, message: 'forbidden' } as AuthorizationResult
        }
        return { isAllowed: true } as AuthorizationResult
      })
      await withDataSet({ authorizeRemoveEntity }, async ({ i, dataSet }) => {
        await dataSet.add(i, { id: 1, value: 'a' }, { id: 2, value: 'b' }, { id: 3, value: 'c' })
        await expect(dataSet.remove(i, 1, 2, 3)).rejects.toBeInstanceOf(AuthorizationError)
        expect(await dataSet.count(i)).toBe(3)
      })
    })

    it('no-ops when called without keys', async () => {
      await withDataSet(undefined, async ({ i, dataSet }) => {
        const listener = vi.fn()
        dataSet.addListener('onEntityRemoved', listener)
        await dataSet.remove(i)
        expect(listener).not.toHaveBeenCalled()
      })
    })
  })
})

import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { InMemoryStore, WithOptionalId } from '@furystack/core'
import { Repository } from './repository'
import { AuthorizationResult, DataSetSettings } from './data-set-setting'
import './injector-extension'

class TestClass {
  public id = 1
  public value = ''
}

describe('DataSet', () => {
  describe('Construction', () => {
    it('can be retrieved from an extension method with class', () => {
      using(new Injector(), (i) => {
        i.setupStores((stores) =>
          stores.addStore(
            new InMemoryStore({
              model: TestClass,
              primaryKey: 'id',
            }),
          ),
        ).setupRepository((r) => r.createDataSet(TestClass, 'id'))
        const dataSet = i.getDataSetFor(TestClass, 'id')
        expect(dataSet.settings.physicalStore.model).toBe(TestClass)
      })
    })

    it('can be retrieved from an extension method with string', () => {
      using(new Injector(), (i) => {
        i.setupStores((stores) =>
          stores.addStore(
            new InMemoryStore({
              model: TestClass,
              primaryKey: 'id',
            }),
          ),
        ).setupRepository((r) => r.createDataSet(TestClass, 'id'))
        const dataSet = i.getDataSetFor(TestClass, 'id')
        expect(dataSet.settings.physicalStore.model).toBe(TestClass)
      })
    })

    it('Should throw if dataset is not registered through extension', () => {
      using(new Injector(), (i) => {
        expect(() => i.getDataSetFor(TestClass, 'id')).toThrowError('')
      })
    })

    it('Should throw if dataset is not registered through service', () => {
      using(new Injector(), (i) => {
        expect(() => i.getInstance(Repository).getDataSetFor(TestClass, 'id')).toThrowError('')
      })
    })
  })

  describe('Authorizers', () => {
    describe('Add', () => {
      it('should add an entity if no settings are provided', async () => {
        await usingAsync(new Injector(), async (i) => {
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(result && result.value).toBe('asd')
        })
      })

      it('should call the add async authorizer and add the entity on pass', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeAdd = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeAdd }))
          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(authorizeAdd).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd')
        })
      })

      it('should throw if the add authorizer returns a non-valid result and should not add a value to the store', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeAdd = jest.fn(async () => ({ isAllowed: false, message: '...' } as AuthorizationResult))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeAdd }))

          const dataSet = await i.getDataSetFor(TestClass, 'id')

          try {
            await dataSet.add(i, { id: 1, value: 'asd' })
            throw Error('Should throw')
          } catch (error) {
            /** */
            expect(authorizeAdd).toBeCalled()
            const added = await dataSet.get(i, 1)
            expect(added).toBeUndefined()
          }
        })
      })

      it('should modify an entity on add, if modifyOnAdd is provided', async () => {
        await usingAsync(new Injector(), async (i) => {
          const modifyOnAdd = jest.fn(
            async (options: { injector: Injector; entity: WithOptionalId<TestClass, 'id'> }) => ({
              ...options.entity,
              value: options.entity.value.toUpperCase(),
            }),
          ) as any

          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { modifyOnAdd }))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(modifyOnAdd).toBeCalled()
          expect(result && result.value).toBe('ASD')
        })
      })

      it('should call the onEntityAdded callback if an entity has been added', async () => {
        await usingAsync(new Injector(), async (i) => {
          expect.assertions(1)
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', {}))

          i.getDataSetFor(TestClass, 'id').onEntityAdded.subscribe(({ entity }) => {
            expect(entity.value).toBe('asd')
          })

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
        })
      })
    })

    describe('Update', () => {
      it('should update an entity if no settings are provided', async () => {
        await usingAsync(new Injector(), async (i) => {
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          const result = await dataSet.get(i, 1)
          expect(result && result.value).toBe('asd2')
        })
      })

      it('should call the authorizeUpdate authorizer and add the entity on pass', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeUpdate = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeUpdate }))
          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdate).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd2')
        })
      })

      it('should throw if the authorizeUpdateEntity returns a non-valid result and should not update a value to the store', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeUpdateEntity = jest.fn(
            async () => ({ isAllowed: false, message: '...' } as AuthorizationResult),
          )
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeUpdateEntity }))

          const dataSet = await i.getDataSetFor(TestClass, 'id')

          try {
            await dataSet.add(i, { id: 1, value: 'asd' })
            await dataSet.update(i, 1, { id: 1, value: 'asd2' })
            throw Error('Should throw')
          } catch (error) {
            /** */
            expect(authorizeUpdateEntity).toBeCalled()
            const added = await dataSet.get(i, 1)
            expect(added && added.value).toBe('asd')
          }
        })
      })
      it('should call the authorizeUpdateEntity authorizer and add the entity on pass', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeUpdateEntity = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeUpdateEntity }))
          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdateEntity).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd2')
        })
      })

      it('should throw if the authorizeUpdate returns a non-valid result and should not update a value to the store', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeUpdate = jest.fn(async () => ({ isAllowed: false, message: '...' } as AuthorizationResult))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeUpdate }))

          const dataSet = await i.getDataSetFor(TestClass, 'id')

          try {
            await dataSet.add(i, { id: 1, value: 'asd' })
            await dataSet.update(i, 1, { id: 1, value: 'asd2' })
            throw Error('Should throw')
          } catch (error) {
            /** */
            expect(authorizeUpdate).toBeCalled()
            const added = await dataSet.get(i, 1)
            expect(added && added.value).toBe('asd')
          }
        })
      })

      it('should modify an entity on update, if modifyOnAdd is provided', async () => {
        await usingAsync(new Injector(), async (i) => {
          const modifyOnUpdate: DataSetSettings<TestClass, 'id'>['modifyOnUpdate'] = jest.fn(async (options) => ({
            ...options.entity,
            value: options.entity.value?.toUpperCase(),
          }))

          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { modifyOnUpdate }))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          const result = await dataSet.get(i, 1)
          expect(modifyOnUpdate).toBeCalled()
          expect(result && result.value).toBe('ASD2')
        })
      })

      it('should publish to the onEntityUpdated observable if an entity has been updated', async () => {
        await usingAsync(new Injector(), async (i) => {
          expect.assertions(1)
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

          i.getDataSetFor(TestClass, 'id').onEntityUpdated.subscribe(({ change }) => {
            expect(change).toEqual({ id: 1, value: 'asd2' })
          })

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
        })
      })
    })

    describe('Count', () => {
      it('should return the count if no settings are provided', async () => {
        await usingAsync(new Injector(), async (i) => {
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.count(i)
          expect(result).toBe(1)
        })
      })

      it('should return the count if authorizeGet returns valid result', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.count(i)
          expect(result).toBe(1)
        })
      })

      it('should throw if authorizeGet returns invalid result', async () => {
        await usingAsync(new Injector(), async (i) => {
          const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
          i.setupStores((stores) =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

          const dataSet = i.getDataSetFor(TestClass, 'id')
          await dataSet.add(i, { id: 1, value: 'asd' })
          try {
            await dataSet.count(i)
            throw Error('Should throw')
          } catch (error) {
            /** */
          }
        })
      })
    })
  })

  describe('filter', () => {
    it('should return the unfiltered result if no settings are provided', async () => {
      await usingAsync(new Injector(), async (i) => {
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.find(i, {})
        expect(result.length).toBe(1)
      })
    })

    it('should return the unfiltered result if authorizeGet returns valid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.find(i, {})
        expect(result.length).toBe(1)
      })
    })

    it('should throw if authorizeGet returns invalid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.find(i, {})
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
      })
    })
  })

  describe('get', () => {
    it('should return the entity if no settings are provided', async () => {
      await usingAsync(new Injector(), async (i) => {
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should return the entity if authorizeGet returns valid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should throw if authorizeGet returns invalid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.get(i, 1)
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
      })
    })

    it('should return the entity if authorizeGetEntity returns valid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGetEntity = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGetEntity }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should throw if authorizeGetEntity returns invalid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeGetEntity = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeGetEntity }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.get(i, 1)
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
      })
    })
  })
  describe('remove', () => {
    it('should remove the entity if no settings are provided', async () => {
      await usingAsync(new Injector(), async (i) => {
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const countValue = await dataSet.count(i)
        expect(countValue).toBe(0)
      })
    })

    it('should remove the entity if authorizeRemove returns valid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeRemove = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeRemove }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const count = await dataSet.count(i)
        expect(count).toBe(0)
      })
    })

    it('should throw if authorizeRemove returns invalid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authorizeRemove = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authorizeRemove }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.remove(i, 1)
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
        const count = await dataSet.count(i)
        expect(count).toBe(1)
      })
    })

    it('should remove the entity if authroizeRemoveEntity returns valid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authroizeRemoveEntity = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authroizeRemoveEntity }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const count = await dataSet.count(i)
        expect(count).toBe(0)
      })
    })

    it('should throw if authroizeRemoveEntity returns invalid result', async () => {
      await usingAsync(new Injector(), async (i) => {
        const authroizeRemoveEntity = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id', { authroizeRemoveEntity }))

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.remove(i, 1)
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
        const count = await dataSet.count(i)
        expect(count).toBe(1)
      })
    })
    it('should publish to the onEntityRemoved observable if an entity has been removed', async () => {
      await usingAsync(new Injector(), async (i) => {
        expect.assertions(1)
        i.setupStores((stores) =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository((repo) => repo.createDataSet(TestClass, 'id'))

        i.getDataSetFor(TestClass, 'id').onEntityRemoved.subscribe(({ key }) => {
          expect(key).toEqual(1)
        })

        const dataSet = i.getDataSetFor(TestClass, 'id')
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
      })
    })
  })
})

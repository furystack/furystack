import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { InMemoryStore } from '@furystack/core'
import { Repository } from '../src/Repository'
import { AuthorizationResult } from '../src/DataSetSettings'
import { DataSet } from '../src/DataSet'
import '@furystack/logging'
import '../src/InjectorExtension'

class TestClass {
  public id = 1
  public value = ''
}

describe('DataSet', () => {
  describe('Construction', () => {
    it('can be retrieved from an extension method with class', () => {
      using(new Injector(), i => {
        i.useLogging()
          .setupStores(stores =>
            stores.addStore(
              new InMemoryStore({
                model: TestClass,
                primaryKey: 'id',
              }),
            ),
          )
          .setupRepository(r => r.createDataSet(TestClass))
        const dataSet: DataSet<TestClass> = i.getDataSetFor(TestClass)
        expect(dataSet.settings.physicalStore.model).toBe(TestClass)
      })
    })

    it('can be retrieved from an extension method with string', () => {
      using(new Injector(), i => {
        i.useLogging()
          .setupStores(stores =>
            stores.addStore(
              new InMemoryStore({
                model: TestClass,
                primaryKey: 'id',
              }),
            ),
          )
          .setupRepository(r => r.createDataSet(TestClass))
        const dataSet = i.getDataSetFor('TestClass')
        expect(dataSet.settings.physicalStore.model).toBe(TestClass)
      })
    })

    it('Should throw if dataset is not registered through extension', () => {
      using(new Injector(), i => {
        i.useLogging()
        expect(() => i.getDataSetFor<TestClass>('TestClass')).toThrowError('')
      })
    })

    it('Should throw if dataset is not registered through service', () => {
      using(new Injector(), i => {
        i.useLogging()
        expect(() => i.getInstance(Repository).getDataSetFor<TestClass>('TestClass')).toThrowError('')
      })
    })
  })

  describe('Authorizers', () => {
    describe('Add', () => {
      it('should add an entity if no settings are provided', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(result && result.value).toBe('asd')
        })
      })

      it('should call the add async authorizer and add the entity on pass', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeAdd = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeAdd }))
          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          expect(authorizeAdd).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd')
        })
      })

      it('should throw if the add authorizer returns a non-valid result and should not add a value to the store', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeAdd = jest.fn(async () => ({ isAllowed: false, message: '...' } as AuthorizationResult))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeAdd }))

          const dataSet = await i.getDataSetFor(TestClass)

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
        await usingAsync(new Injector().useLogging(), async i => {
          const modifyOnAdd = jest.fn(async (options: { injector: Injector; entity: TestClass }) => ({
            ...options.entity,
            value: options.entity.value.toUpperCase(),
          }))

          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { modifyOnAdd }))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.get(i, 1)
          expect(modifyOnAdd).toBeCalled()
          expect(result && result.value).toBe('ASD')
        })
      })

      it('should call the onEntityAdded callback if an entity has been added', async done => {
        await usingAsync(new Injector().useLogging(), async i => {
          const onEntityAdded = jest.fn(async (options: { injector: Injector; entity: TestClass }) => {
            done()
          })

          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { onEntityAdded }))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
        })
      })
    })

    describe('Update', () => {
      it('should update an entity if no settings are provided', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          const result = await dataSet.get(i, 1)
          expect(result && result.value).toBe('asd2')
        })
      })

      it('should call the authorizeUpdate authorizer and add the entity on pass', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeUpdate = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeUpdate }))
          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdate).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd2')
        })
      })

      it('should throw if the authorizeUpdateEntity returns a non-valid result and should not update a value to the store', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeUpdateEntity = jest.fn(
            async () => ({ isAllowed: false, message: '...' } as AuthorizationResult),
          )
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeUpdateEntity }))

          const dataSet = await i.getDataSetFor(TestClass)

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
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeUpdateEntity = jest.fn(async () => ({ isAllowed: true } as AuthorizationResult))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeUpdateEntity }))
          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          expect(authorizeUpdateEntity).toBeCalled()
          const added = await dataSet.get(i, 1)
          expect(added && added.value).toBe('asd2')
        })
      })

      it('should throw if the authorizeUpdate returns a non-valid result and should not update a value to the store', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeUpdate = jest.fn(async () => ({ isAllowed: false, message: '...' } as AuthorizationResult))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeUpdate }))

          const dataSet = await i.getDataSetFor(TestClass)

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
        await usingAsync(new Injector().useLogging(), async i => {
          const modifyOnUpdate = jest.fn(async (options: { injector: Injector; entity: TestClass }) => ({
            ...options.entity,
            value: options.entity.value.toUpperCase(),
          }))

          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { modifyOnUpdate }))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
          const result = await dataSet.get(i, 1)
          expect(modifyOnUpdate).toBeCalled()
          expect(result && result.value).toBe('ASD2')
        })
      })

      it('should call the onEntityAdded callback if an entity has been added', async done => {
        await usingAsync(new Injector().useLogging(), async i => {
          const onEntityUpdated = jest.fn(async () => {
            done()
          })

          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { onEntityUpdated }))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          await dataSet.update(i, 1, { id: 1, value: 'asd2' })
        })
      })
    })

    describe('Count', () => {
      it('should return the count if no settings are provided', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.count(i)
          expect(result).toBe(1)
        })
      })

      it('should return the count if authorizeGet returns valid result', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

          const dataSet = i.getDataSetFor(TestClass)
          await dataSet.add(i, { id: 1, value: 'asd' })
          const result = await dataSet.count(i)
          expect(result).toBe(1)
        })
      })

      it('should throw if authorizeGet returns invalid result', async () => {
        await usingAsync(new Injector().useLogging(), async i => {
          const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
          i.setupStores(stores =>
            stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
          ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

          const dataSet = i.getDataSetFor(TestClass)
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
      await usingAsync(new Injector().useLogging(), async i => {
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.filter(i, {})
        expect(result.length).toBe(1)
      })
    })

    it('should return the unfiltered result if authorizeGet returns valid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.filter(i, {})
        expect(result.length).toBe(1)
      })
    })

    it('should throw if authorizeGet returns invalid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        try {
          await dataSet.filter(i, {})
          throw Error('Should throw')
        } catch (error) {
          /** */
        }
      })
    })
  })

  describe('get', () => {
    it('should return the entity if no settings are provided', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should return the entity if authorizeGet returns valid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should throw if authorizeGet returns invalid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGet = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGet }))

        const dataSet = i.getDataSetFor(TestClass)
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
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGetEntity = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGetEntity }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        const result = await dataSet.get(i, 1)
        expect(result && result.id).toBe(1)
      })
    })

    it('should throw if authorizeGetEntity returns invalid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeGetEntity = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeGetEntity }))

        const dataSet = i.getDataSetFor(TestClass)
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
      await usingAsync(new Injector().useLogging(), async i => {
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const countValue = await dataSet.count(i)
        expect(countValue).toBe(0)
      })
    })

    it('should remove the entity if authorizeRemove returns valid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeRemove = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeRemove }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const count = await dataSet.count(i)
        expect(count).toBe(0)
      })
    })

    it('should throw if authorizeRemove returns invalid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authorizeRemove = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authorizeRemove }))

        const dataSet = i.getDataSetFor(TestClass)
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
      await usingAsync(new Injector().useLogging(), async i => {
        const authroizeRemoveEntity = jest.fn(async () => ({ isAllowed: true, message: '' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authroizeRemoveEntity }))

        const dataSet = i.getDataSetFor(TestClass)
        await dataSet.add(i, { id: 1, value: 'asd' })
        await dataSet.remove(i, 1)
        const count = await dataSet.count(i)
        expect(count).toBe(0)
      })
    })

    it('should throw if authroizeRemoveEntity returns invalid result', async () => {
      await usingAsync(new Injector().useLogging(), async i => {
        const authroizeRemoveEntity = jest.fn(async () => ({ isAllowed: false, message: ':(' }))
        i.setupStores(stores =>
          stores.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' })),
        ).setupRepository(repo => repo.createDataSet(TestClass, { authroizeRemoveEntity }))

        const dataSet = i.getDataSetFor(TestClass)
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
  })
})

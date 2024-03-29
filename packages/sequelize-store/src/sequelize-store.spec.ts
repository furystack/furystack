import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'
import { StoreManager } from '@furystack/core'
import { useSequelize } from './store-manager-helpers.js'
import { DataTypes, Model } from 'sequelize'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { SequelizeClientFactory } from './sequelize-client-factory.js'
import type { SequelizeStore } from './sequelize-store.js'
import { describe, it, expect } from 'vitest'

class TestSequelizeClass extends Model<TestClass, TestClass> implements TestClass {
  declare id: number
  declare stringValue1: string
  declare stringValue2: string
  declare numberValue1: number
  declare numberValue2: number
  declare booleanValue: boolean
  declare dateValue: Date
}

describe('Sequelize Store', () => {
  createStoreTest({
    typeName: 'sequelize-store',
    skipRegexTests: true,
    createStore: (i) => {
      useSequelize({
        injector: i,
        model: TestClass,
        sequelizeModel: TestSequelizeClass,
        primaryKey: 'id',
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
        initModel: async (sequelize) => {
          TestSequelizeClass.init(
            {
              id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
              },
              stringValue1: {
                type: DataTypes.STRING,
              },
              stringValue2: {
                type: DataTypes.STRING,
              },
              numberValue1: {
                type: DataTypes.INTEGER,
              },
              numberValue2: {
                type: DataTypes.INTEGER,
              },
              booleanValue: {
                type: DataTypes.BOOLEAN,
              },
              dateValue: {
                type: DataTypes.DATE,
              },
            },
            { sequelize, timestamps: false },
          )
        },
      })
      const store = i.getInstance(StoreManager).getStoreFor(TestClass, 'id')
      return store
    },
  })

  it('should return the cached sequelize client instance from the factory', async () => {
    await usingAsync(new Injector(), async (i) => {
      const factory = i.getInstance(SequelizeClientFactory)
      const settings = {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
      } as const
      const client1 = factory.getSequelizeClient(settings)
      const client2 = factory.getSequelizeClient(settings)
      expect(client1).toBe(client2)
    })
  })

  it('should return the cached model from the store class', async () => {
    await usingAsync(new Injector(), async (i) => {
      useSequelize({
        injector: i,
        model: TestClass,
        sequelizeModel: TestSequelizeClass,
        primaryKey: 'id',
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
        initModel: async (sequelize) => {
          await sleepAsync(100)
          TestSequelizeClass.init(
            {
              id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
              },
              stringValue1: {
                type: DataTypes.STRING,
              },
              stringValue2: {
                type: DataTypes.STRING,
              },
              numberValue1: {
                type: DataTypes.INTEGER,
              },
              numberValue2: {
                type: DataTypes.INTEGER,
              },
              booleanValue: {
                type: DataTypes.BOOLEAN,
              },
              dateValue: {
                type: DataTypes.DATE,
              },
            },
            { sequelize, timestamps: false },
          )
        },
      })
      const store: SequelizeStore<TestClass, TestSequelizeClass, 'id'> = i
        .getInstance(StoreManager)
        .getStoreFor(TestClass, 'id')

      const model1Promise = store.getModel()
      const model2 = await store.getModel()

      const model1 = await model1Promise

      expect(model2).toBe(model1)
      const model3 = await store.getModel()
      expect(model3).toBe(model1)
    })
  })

  it('should throw if the sequelize model is not initialized', async () => {
    await usingAsync(new Injector(), async (i) => {
      useSequelize({
        injector: i,
        model: TestClass,
        sequelizeModel: TestSequelizeClass,
        primaryKey: 'id',
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
        initModel: async () => {
          // won't init the model here
        },
      })
      const store: SequelizeStore<TestClass, TestSequelizeClass, 'id'> = i
        .getInstance(StoreManager)
        .getStoreFor(TestClass, 'id')

      expect.assertions(1)
      try {
        await store.getModel()
      } catch (error) {
        expect((error as Error).message).toBe('TestSequelizeClass has not been defined') // will be thrown by sequelize
      }
    })
  })
})

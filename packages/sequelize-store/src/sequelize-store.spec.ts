import { StoreManager, TestClass, createStoreTest } from '@furystack/core'
import { useSequelize } from './store-manager-helpers'
import { DataTypes, Model } from 'sequelize'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { SequelizeClientFactory } from './sequelize-client-factory'

jest.mock('uuid', () => {
  return {
    v1: jest.fn(() => 'uuid'),
    v4: jest.fn(() => 'uuid'),
  }
})

class TestSequelizeClass extends Model implements TestClass {
  id!: number
  stringValue1!: string
  stringValue2!: string
  numberValue1!: number
  numberValue2!: number
  booleanValue!: boolean
  dateValue!: Date
}

describe('Sequelize Store', () => {
  createStoreTest({
    typeName: 'sequelize-store',
    skipRegexTests: true,
    createStore: (i) => {
      useSequelize({
        injector: i,
        model: TestSequelizeClass,
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
      const store = i.getInstance(StoreManager).getStoreFor(TestSequelizeClass, 'id')
      return store
    },
  })

  it('should return the cached client from the factory', () => {
    usingAsync(new Injector(), async (i) => {
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
})

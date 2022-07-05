import { StoreManager, TestClass, createStoreTest } from '@furystack/core'
import { useSequelize } from './store-manager-helpers'
import { DataTypes, Model, Sequelize } from 'sequelize'
import { HealthCheckUnhealthyResult, usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { SequelizeStore } from './sequelize-store'

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

const initModel = async (sequelize: Sequelize) => {
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
  it('should report healthy status if the model can be retrieved', async () => {
    await usingAsync(new Injector(), async (i) => {
      useSequelize({
        injector: i,
        model: TestSequelizeClass,
        primaryKey: 'id',
        initModel,
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      })

      const store = i.getInstance(StoreManager).getStoreFor(TestSequelizeClass, 'id')
      const healthCheckResult = await (store as SequelizeStore<TestSequelizeClass, 'id'>).checkHealth()
      expect(healthCheckResult.healthy).toBe('healthy')
    })
  })

  it('should report unhealthy status if the model cannot be retrieved', async () => {
    await usingAsync(new Injector(), async (i) => {
      useSequelize({
        injector: i,
        model: TestSequelizeClass,
        primaryKey: 'id',
        initModel: () => {
          throw Error(':(')
        },
        options: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      })

      const store = i.getInstance(StoreManager).getStoreFor(TestSequelizeClass, 'id')
      const healthCheckResult = await (store as SequelizeStore<TestSequelizeClass, 'id'>).checkHealth()
      expect(healthCheckResult.healthy).toBe('unhealthy')
      expect((healthCheckResult as HealthCheckUnhealthyResult).reason).toEqual({ message: 'Error: :(' })
    })
  })
})

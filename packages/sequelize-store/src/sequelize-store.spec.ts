import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/dist/cjs/create-physical-store-tests'
import './store-manager-extensions'
import { DataTypes, Model } from 'sequelize'

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
    createStore: () => {
      const i = new Injector().setupStores((sm) =>
        sm.useSequelize({
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
        }),
      )
      const store = i.getInstance(StoreManager).getStoreFor(TestSequelizeClass, 'id')
      return store
    },
  })
})

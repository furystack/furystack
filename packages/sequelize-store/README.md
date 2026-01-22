# @furystack/sequelize-store

Sequelize physical store implementation for FuryStack.

## Installation

```bash
npm install @furystack/sequelize-store
# or
yarn add @furystack/sequelize-store
```

## Initialization

```ts
import { Injector } from '@furystack/inject'
import { StoreManager, type PhysicalStore } from '@furystack/core'
import { useSequelize } from '@furystack/sequelize-store'
import { Model, type Options } from 'sequelize'

export class TestEntry extends Model {
  declare public _id: string
  declare public value: string
}

const myInjector = new Injector()
useSequelize({
  injector: myInjector,
  model: TestEntry,
  sequelizeModel: TestEntry, // Your Sequelize Model class
  primaryKey: '_id',
  options: {
    // Sequelize connection options
    dialect: 'sqlite',
    storage: ':memory:',
  } as Options,
})

const myStore: PhysicalStore<TestEntry, '_id'> = myInjector.getInstance(StoreManager).getStoreFor(TestEntry, '_id')
```

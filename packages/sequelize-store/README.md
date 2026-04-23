# @furystack/sequelize-store

Sequelize physical store implementation for FuryStack.

## Installation

```bash
npm install @furystack/sequelize-store
# or
yarn add @furystack/sequelize-store
```

## Initialization

`defineSequelizeStore` mints a `StoreToken` backed by a Sequelize model. The
shared `SequelizeClientFactory` singleton pools `Sequelize` clients keyed by
`JSON.stringify(options)` and closes them when the owning injector is
disposed.

```ts
import { createInjector } from '@furystack/inject'
import { defineSequelizeStore } from '@furystack/sequelize-store'
import { defineDataSet } from '@furystack/repository'
import { Model, type Options } from 'sequelize'

export class TestEntry extends Model {
  declare public _id: string
  declare public value: string
}

export const TestEntryStore = defineSequelizeStore<TestEntry, TestEntry, '_id'>({
  name: 'my-app/TestEntryStore',
  model: TestEntry,
  sequelizeModel: TestEntry,
  primaryKey: '_id',
  options: {
    dialect: 'sqlite',
    storage: ':memory:',
  } as Options,
})

export const TestEntryDataSet = defineDataSet({
  name: 'my-app/TestEntryDataSet',
  store: TestEntryStore,
})

const myInjector = createInjector()
const dataSet = myInjector.get(TestEntryDataSet)
```

> **Tip:** For application-level data access, always go through a
> `DataSetToken` rather than resolving the `StoreToken` directly. The
> DataSet layer runs authorization, modification hooks, and entity-sync
> events; a direct store access skips all of them. The
> `furystack/no-direct-store-token` lint rule guards against this.

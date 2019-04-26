# repository

Repository implementation for FuryStack

## Setting up a repository

You can set up a repository in the following way

```ts
class MyModel {
  public id!: number
  public value!: string
}

const myInjector = new Injector()
myInjector
  .setupStores(stores => stores.addStore(new InMemoryStore({ model: MyModel, primaryKey: 'id' })))
  .setupRepository(repo =>
    repo.createDataSet(MyModel, {
      onEntityAdded: ({ injector, entity }) => {
        injector.logger.verbose({ message: `An entity added with value '${entity.value}'` })
      },
      authorizeUpdate: async () => ({
        isAllowed: false,
        message: 'This is a read only dataset. No update is allowed. :(',
      }),
      /** custom repository options */
    }),
  )
```

In the following example we've created a physical InMemory store for the model MyModel, and we've configured a Repository with a DataSet.
It will log to a logger when an entity has been added and it won't allow us to update entities.

### Working with the DataSet

A DataSet is similar to a physical store, but it can have custom event callbacks and authorization logic.
You can retrieve the dataset in a following way:

```ts
const dataSet = myInjector.getDataSetFor(MyModel)
dataSet.add(myInjector, { id: 1, value: 'foo' }) // <-- this will log to a logger
dataSet.update(myInjector, 1, { id: 1, value: 'bar' }) // <--- this one will be rejected
```

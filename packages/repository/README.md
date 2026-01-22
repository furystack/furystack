# @furystack/repository

Repository implementation for FuryStack.
With a repository, you can implement entity-level business logic in an easy and structured way.
You can authorize, manipulate, and observe CRUD operations.

## Setting Up a Repository

You can set up a repository as follows:

```ts
import { Injector } from '@furystack/inject'
import { InMemoryStore, addStore } from '@furystack/core'
import { getRepository, getDataSetFor } from '@furystack/repository'
import { getLogger } from '@furystack/logging'

class MyModel {
  declare id: number
  declare value: string
}

const myInjector = new Injector()
addStore(myInjector, new InMemoryStore({ model: MyModel, primaryKey: 'id' }))
getRepository(myInjector).createDataSet(MyModel, 'id', {
  onEntityAdded: ({ injector, entity }) => {
    getLogger(injector).verbose({ message: `An entity was added with value '${entity.value}'` })
  },
  authorizeUpdate: async () => ({
    isAllowed: false,
    message: 'This is a read-only dataset. No update is allowed. :(',
  }),
})
```

In the example above, we've created a physical InMemory store for the model `MyModel`, and we've configured a repository with a DataSet.
It will log to a logger when an entity has been added, and it won't allow updates to entities.

### Working with the DataSet

A DataSet is similar to a physical store, but it can have custom event callbacks and authorization logic.
You can retrieve the dataset as follows:

```ts
const dataSet = getDataSetFor(myInjector, MyModel, 'id')
dataSet.add(myInjector, { id: 1, value: 'foo' }) // <-- this will log to a logger
dataSet.update(myInjector, 1, { id: 1, value: 'bar' }) // <--- this one will be rejected
```

### Events

Events are great for logging or monitoring DataSet changes or distributing changes to clients. They are simple optional callbacks – if defined, they will be called on a specific event. These events are `onEntityAdded`, `onEntityUpdated`, and `onEntityRemoved`

### Authorizing operations

**Authorizers** are similar callbacks but they have to return a promise with an `AuthorizationResult` object - you can allow or deny CRUD operations or add additional filters to collections with these Authorize callbacks. These are `authorizeAdd`, `authorizeUpdate`, `authorizeUpdateEntity` (this needs an additional reload of entity but can compare with the original one), `authorizeRemove`, `authorizeRemoveEntity` (also needs reloading), `authorizeGet`, `authorizeGetEntity` (also needs reloading),

### Modifiers and additional filters

There are some callbacks that modifies an entity before persisting (like `modifyOnAdd` or `modifyOnUpdate`). For example, you can fill createdByUser or lastModifiedByUser fields with these.
There is an additional property called `addFilter`, you can use that to add a pre-filter condition **before** a filter expression will be evaluated in the data store - ensuring e.g. that the user can _retrieve_ only suff from the physical store that she has enough permission.

### Getting the Context

All methods above has an _injector instance_ on the call parameter - you can use that injector to get service instances from the right caller context. It means that you can use e.g.: HttpUserContext to getting the current user.

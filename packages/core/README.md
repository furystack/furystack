# @furystack/core

Core package for FuryStack with generic type and interface definitions and concepts.

## Concepts

### Physical Store

In **FuryStack**, the preferred way to access data is via physical stores. A physical store is a minimal interface that a store should implement. A store is always bound to a collection with a specified type of entities. It can only do basic CRUD operations (create, get by ID, filter, delete, count). These stores should not have concepts about relations, indexes, or other storage-specific details. Data stores don't care about permission, role, or session checking.

### Identity Context

The generic way to implement authentication and authorization logic is with an Identity Context – you can use it on both backend and frontend.

### User

The `User` model is a simple class that represents an application user with a `username` and a list of `roles`. You can extend this class to add custom properties for your application.

```ts
import { User } from '@furystack/core'

class MyUser extends User {
  declare email: string
  declare createdAt: Date
}
```

## Other Utilities

### Global Disposables

Global Disposables is a list you can fill with disposables that will be disposed on app exit – this helps with graceful app shutdowns.

```ts
import { globalDisposables } from '@furystack/core'

globalDisposables.add(myRootInjector)
```

### Generic Tests for Physical Stores

There is a set of generic store tests you can use to test your custom store implementation, as the following example shows:

```ts
import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'

describe('myStore', () => {
  createStoreTest({
    createStore: () => new MyStoreImplementation(TestClass, ...ctorArgs),
    typeName: 'MyStoreImplementation',
  })
})
```

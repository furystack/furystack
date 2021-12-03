# @furystack/core

Core package for FuryStack with some generic type and interface definitions and concepts

## Concepts

### Physical Store

In **FuryStack**, the preferred mode of accessing data is via physical stores. A physical store is a bare minimum interface that a store should do. A store is always bound to a collection with a specified type of entities. It can only do the basic CRUD operations (create, get by Id, filter, delete, count). These stores should not have a concept about relations, indexes and other storage-specific stuff. Data stores doesn't care about permission, role or session checking.

### Identity Context

The generic way to implement authentication and authorization logic is an Identity Context - You can use it on both backend and frontend

### User

...yo...

## Other utilities

### Global Disposables

Global Disposables is a list that you can fill with disposables that will be disposed on app exit - this helps graceful app shutdowns.
```ts

import { globalDisposables } from '@furystack/core/dist/cjs/create-physical-store-tests'

globalDisposables.add(myRootInjector)

```

### Generic tests for physical stores

There is a set of generic store test that you can use to test your custom store implementation as the following example shows:

```ts
import { TestClass, createStoreTest } from '@furystack/core/dist/cjs/create-physical-store-tests'

describe('myStore', ()=>{
    createStoreTest({
        createStore: () => new MyStoreImplementation(TestClass, ...ctorArgs),
        typeName: 'MyStoreImplementation',
    })
})


```

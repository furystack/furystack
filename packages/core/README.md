# @furystack/core

Core package for FuryStack with some generic type and interface definitions and concepts

## Concepts

### Physical Store

A physical store represents how do you store data - it can contain an abstraction between FuryStack and e.g. an external ORM, In Memory Store or any other data provider

### Identity Context

The generic way to implement authentication and authorization logic is an Identity Context - You can use it on both backend and frontend

### User

...yo...

## Other utilities

### Global Disposables

Global Disposables is a list that you can fill with disposables that will be disposed on app exit - this helps graceful app shutdowns.
```ts

import { globalDisposables } from '@furystack/core/dist/create-physical-store-tests'

globalDisposables.add(myRootInjector)

```

### Generic tests for physical stores

There is a set of generic store test that you can use to test your custom store implementation as the following example shows:

```ts
import { TestClass, createStoreTest } from '@furystack/core/dist/create-physical-store-tests'

describe('myStore', ()=>{
    createStoreTest({
        createStore: () => new MyStoreImplementation(TestClass, ...ctorArgs),
        typeName: 'MyStoreImplementation',
    })
})


```

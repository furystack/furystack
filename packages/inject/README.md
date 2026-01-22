# @furystack/inject

Dependency injection / inversion of control package for FuryStack.

## Installation

```bash
npm install @furystack/inject
# or
yarn add @furystack/inject
```

## Injector

Injectors act as containers; they are responsible for creating and retrieving service instances based on the provided Injectable metadata. You can create an injector by simply instantiating the class:

```ts
import { Injector } from '@furystack/inject'

const myInjector = new Injector()
```

You can organize your injectors in trees by creating child injectors. You can use the children and services with scoped lifetime for contextual services:

```ts
const childInjector = myInjector.createChild({ owner: 'myCustomContext' })
```

## Injectable

### Creating an Injectable Service from a Class

You can create an injectable service from a plain class by decorating it with the `@Injectable()` decorator:

```ts
import { Injectable } from '@furystack/inject'

@Injectable({
  /** Injectable options */
})
export class MyService {
  /** ...service implementation... */

  constructor(s1: OtherInjectableService, s2: AnotherInjectableService) {}
}
```

The constructor parameters (`s1: OtherInjectableService` and `s2: AnotherInjectableService`) should also be decorated and will be resolved recursively.

### Lifetime

You can define a specific lifetime for injectable services in the decorator:

```ts
@Injectable({
  lifetime: 'transient',
})
export class MyService {
  /** ...service implementation... */
}
```

The lifetime can be

- **transient** - A new instance will be created each time when you get an instance
- **scoped** - A new instance will be created _if it doesn't exist on the current scope_. Can be useful for injectable services that can be used for contextual data.
- **singleton** - A new instance will be created only if it doesn't exist on the _root_ injector. It will act as a singleton in other cases.

Injectables can only depend on services with _longer lifetime_, e.g. a **transient** can depend on a **singleton**, but inverting it will throw an error

### Retrieving your service from the injector

You can retrieve a service by calling

```ts
const service = myInjector.getInstance(MyService)
```

### Explicit instance setup

There are cases that you have to set a service instance explicitly. You can do that in the following way

```ts
class MyService {
  constructor(public readonly foo: string)
}

myInjector.setExplicitInstance(new MyService('bar'))
```

### Extension methods

A simple injector can easily be extended from 3rd party packages with extension methods, just like the FuryStack packages. These extension methods usually provide a shortcut to an instance or set up a preconfigured explicit instance of a service. You can build clean and fluent APIs in this way - you can check the [logging helpers](https://github.com/furystack/furystack/blob/develop/packages/logging/src/helpers.ts) for an example

### A few things to care about

**Circular imports:** If two of your services are importing each other, one of them will be ignored by CommonJS. TypeScript won't complain at compile time, but if you get this:
`Uncaught TypeError: SomeService is not a constructor` - you should start reviewing how your injectables depend on each other.

**There is also a limitation by design:** A service can depend only on a service with a higher or equal lifetime than its lifetime. That means a _singleton_ cannot depend on a _transient_ or scoped service - you should get an exception at runtime if you try it.

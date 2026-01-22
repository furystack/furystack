# @furystack/utils

General utilities for FuryStack.

## Disposable

You can implement disposable resources and use them with `using()` or `usingAsync()` syntax:

```ts
import { using, usingAsync } from '@furystack/utils'

class Resource implements Disposable {
  [Symbol.dispose]() {
    // cleanup logic
  }
}

using(new Resource(), (resource) => {
  // do something with the resource
})

await usingAsync(new Resource(), async (resource) => {
  // do something with the resource, allows awaiting promises
})
```

## ObservableValue

You can track value changes using this simple Observable implementation:

```ts
import { ObservableValue } from '@furystack/utils'

const observableValue = new ObservableValue<number>(0)
const observer = observableValue.subscribe((newValue) => {
  console.log('Value changed:', newValue)
})

// To update the value
observableValue.setValue(Math.random())
// To dispose a single observer
observer[Symbol.dispose]()
// To dispose the whole observableValue with all of its observers:
observableValue[Symbol.dispose]()
```

## PathHelper

Helper class for path-related functions and methods:

```ts
import { PathHelper } from '@furystack/utils'

PathHelper.joinPaths('api', 'users', '123') // 'api/users/123'
PathHelper.getSegments('/api/users/123') // ['api', 'users', '123']
PathHelper.getParentPath('/api/users/123') // 'api/users'
PathHelper.trimSlashes('/api/') // 'api'
PathHelper.joinUrl('http://example.com', '/api') // 'http://example.com/api'
```

## deepMerge

Deep merge objects together:

```ts
import { deepMerge } from '@furystack/utils'

const target = { a: 1, b: { c: 2 } }
const source = { b: { d: 3 } }
const result = deepMerge(target, source) // { a: 1, b: { c: 2, d: 3 } }
```

## sleepAsync

Simple promise-based sleep utility:

```ts
import { sleepAsync } from '@furystack/utils'

await sleepAsync(1000) // wait 1 second
```

## debounce

Debounce a function to limit how often it can be called:

```ts
import { debounce } from '@furystack/utils'

const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query)
}, 300)

debouncedSearch('hello') // Will only execute after 300ms of no calls
```

## EventHub

A typed event emitter:

```ts
import { EventHub } from '@furystack/utils'

type MyEvents = {
  userLoggedIn: { userId: string }
  userLoggedOut: { userId: string }
}

const hub = new EventHub<MyEvents>()

hub.subscribe('userLoggedIn', (event) => {
  console.log('User logged in:', event.userId)
})

hub.emit('userLoggedIn', { userId: '123' })
```

## Type Guards

Check if a value is disposable:

```ts
import { isDisposable, isAsyncDisposable } from '@furystack/utils'

if (isDisposable(value)) {
  value[Symbol.dispose]()
}

if (isAsyncDisposable(value)) {
  await value[Symbol.asyncDispose]()
}
```

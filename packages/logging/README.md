# @furystack/logging

Logging package for FuryStack.

## Installation

```bash
npm install @furystack/logging
# or
yarn add @furystack/logging
```

## Initializing with @furystack/inject

You can start using the logging service with an injector as follows:

```ts
import { createInjector } from '@furystack/inject'
import { ConsoleLogger, useLogging } from '@furystack/logging'

const myInjector = createInjector()
useLogging(myInjector, ConsoleLogger, Logger1, Logger2 /* ...your Logger tokens or instances */)
```

`useLogging(injector, ...loggers)` rebinds the `LoggerRegistry` with the given
set and invalidates the collection so the next `getLogger(injector)` resolves
the new composition. Each entry can be a `Logger` instance or a
`Token<Logger, 'singleton'>`.

You can retrieve the Logger instance with:

```ts
import { getLogger } from '@furystack/logging'

const myLogger = getLogger(myInjector)
```

Or with a specific scope:

```ts
getLogger(myInjector).withScope('CustomScope')
```

## Logging Events

You can log a simple event with:

```ts
myLogger.addEntry({
  level: 'verbose',
  message: 'My log message',
  scope: '@furystack/logging/test',
  data: {
    foo: 1,
    bar: 42,
  },
})
```

Or:

```ts
myLogger.verbose({
  message: 'My log message',
  scope: '@furystack/logging/test',
  data: {
    foo: 1,
    bar: 42,
  },
})
```

The two snippets do the same - they will add a log entry to _each_ registered logger.

### Scoped Loggers

In most cases, you use a logger in a service with a specific scope. You can create and use a scoped logger in the following way:

```ts
const scopedLogger = myLogger.withScope('@furystack/logging/test')
scopedLogger.verbose({ message: 'FooBarBaz' })
```

### Implementing Your Own Logger

`AbstractLogger` was removed in v7. Build custom loggers with `createLogger(backend)` — pass a `LoggerBackend` that persists the leveled log entry to your sink of choice. The factory wires the level convenience methods (`verbose` / `debug` / `information` / `warning` / `error` / `fatal`) and `withScope` sugar, and handles error isolation (failures at `error` level escalate to `fatal`; failures at `fatal` fall back to `console.error`).

```ts
import { defineService } from '@furystack/inject'
import { createLogger, type LeveledLogEntry, type Logger } from '@furystack/logging'

export const MyCustomLogCollectorToken = defineService<Logger, 'singleton'>({
  name: 'my-app/MyCustomLogCollector',
  lifetime: 'singleton',
  factory: () => {
    const entries: Array<LeveledLogEntry<unknown>> = []
    return createLogger(async (entry) => {
      entries.push(entry)
    })
  },
})

// Register alongside ConsoleLogger:
useLogging(myInjector, ConsoleLogger, MyCustomLogCollectorToken)
```

# @furystack/logging

Logging package for FuryStack.

## Initializing with @furystack/inject

You can start using the logging service with an injector as follows:

```ts
import { ConsoleLogger } from '@furystack/logging'

const myInjector = new Injector().useLogging(ConsoleLogger, Logger1, Logger2 /* ...your Logger implementations */)
```

You can retrieve the Logger instance with:

```ts
const myLogger = myInjector.getLogger()
```

Or with a specific scope:

```ts
myInjector.getLogger().withScope('CustomScope')
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

You can implement your own logging logic in a similar way as this custom log collector:

```ts
import { AbstractLogger, ILeveledLogEntry } from '@furystack/logging'

@Injectable({ lifetime: 'singleton' })
export class MyCustomLogCollector extends AbstractLogger {
  private readonly entries: Array<ILeveledLogEntry<any>> = []

  public getEntries() {
    return [...this.entries]
  }

  public async addEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
    this.entries.push(entry)
  }

  constructor() {
    super()
  }
}
```

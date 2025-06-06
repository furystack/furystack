# @furystack/utils

General utilities for FuryStack.

### Disposable

You can implement disposable resources and use them with `using()` or `usingAsync()` syntax. Example:

```ts
class Resource implements IDisposable {
  dispose() {
    // cleanup logic
  }
}

using(new Resource(), (resource) => {
  // do something with the resource
})

usingAsync(new Resource(), async (resource) => {
  // do something with the resource, allows awaiting promises
})
```

### ObservableValue and ValueObservers

You can track value changes using this simple Observable implementation.

Example:

```ts
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

### PathHelper

This class contains helper methods for path transformation and manipulation.

### Retrier

Retrier is a utility that can keep trying an operation until it succeeds, times out or reach a specified retry limit.

```ts
const funcToRetry: () => Promise<boolean> = async () => {
  const hasSucceeded = false
  // ...
  // custom logic
  // ...
  return hasSucceeded
}
const retrierSuccess = await Retrier.create(funcToRetry)
  .setup({
    Retries: 3,
    RetryIntervalMs: 1,
    timeoutMs: 1000,
  })
  .run()
```

### Trace

Trace is an utility that can be used to track method calls, method returns and errors

```ts
const methodTracer: IDisposable = Trace.method({
  object: myObjectInstance, // You can define an object constructor for static methods as well
  method: myObjectInstance.method, // The method to be tracked
  isAsync: true, // if you set to async, method finished will be *await*-ed
  onCalled: (traceData) => {
    console.log('Method called:', traceData)
  },
  onFinished: (traceData) => {
    console.log('Method call finished:', traceData)
  },
  onError: (traceData) => {
    console.log('Method throwed an error:', traceData)
  },
})

// if you want to stop receiving events
methodTracer[Symbol.dispose]()
```

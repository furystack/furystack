<!-- version-type: minor -->

# @furystack/utils

## ✨ Features

### Error handling in `EventHub` listeners

`EventHub.emit()` now catches synchronous throws and asynchronous rejections from listeners. Errors are routed to `onListenerError` subscribers when present, or logged via `console.error` otherwise.

A new `ListenerErrorPayload` type is exported for typing the error event:

```typescript
type MyEvents = {
  dataReceived: { items: string[] }
  onListenerError: ListenerErrorPayload
}

const hub = new EventHub<MyEvents>()

hub.subscribe('onListenerError', ({ event, error }) => {
  console.error(`Listener for "${String(event)}" failed:`, error)
})
```

### Configurable error handling in `ObservableValue`

`ObservableValueOptions` now accepts an `onError` callback, invoked when an observer callback or filter throws (sync) or rejects (async). All remaining observers are still notified even when one fails. Defaults to `console.error`.

```typescript
const value = new ObservableValue('initial', {
  onError: ({ error, observer }) => {
    myLogger.error('Observer failed', { error })
  },
})
```

## 🧪 Tests

- Added tests for `EventHub` listener error routing (sync throws, async rejections, `onListenerError` dispatch)
- Added tests for `ObservableValue` observer error handling (sync throws, async rejections, custom `onError` callback)

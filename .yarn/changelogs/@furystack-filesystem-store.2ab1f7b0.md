<!-- version-type: minor -->

# @furystack/filesystem-store

## ✨ Features

### New `onLoadError` event

`FileSystemStore` now exposes an `onLoadError` event on its `EventHub`. The constructor schedules the initial reload in the background, and the FS watcher triggers a reload on every external change — failures from either path used to surface only as unhandled promise rejections. They are now emitted via `onLoadError` so consumers can log, retry, or fall back without monkey-patching.

```ts
const store = new FileSystemStore({ model: Item, fileName: '/srv/data.json', primaryKey: 'id' })
store.addListener('onLoadError', ({ error }) => log.error('store reload failed', { error }))
```

## ♻️ Refactoring

### `hasChanges` is now read-only; `tick` is private

`FileSystemStore.hasChanges` is now a getter backed by the private `_hasChanges` field — external mutation was always a footgun (the dirty flag is owned by `add` / `update` / `remove` / `saveChanges`) and is now a type error. The internal `tick` interval handle was demoted from `public` to `private` for the same reason. No supported call site mutated either, so this is a safety tightening rather than a behavior change.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.

## 📚 Documentation

- Rewrote JSDoc on `FileSystemStore` and `defineFileSystemStore` to follow the new value-test guidance: dropped restate-the-type narration, called out the init-race contract (calls before the background reload resolves see an empty cache), the `ENOENT` swallow on first run, and the requirement to `await` the async dispose to avoid lost writes.

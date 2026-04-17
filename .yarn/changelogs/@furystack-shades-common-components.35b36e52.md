<!-- version-type: patch -->

# @furystack/shades-common-components

## ✨ Features

### Automatic reference reconciliation in `CollectionService` via `idField`

`CollectionServiceOptions` now accepts an optional `idField` that identifies a stable identity key on entries. When provided, `CollectionService` subscribes to its own `data` observable and automatically reconciles `focusedEntry` and `selection` against the new entries array whenever `data` changes, swapping stale object references for their matching counterparts by id.

This keeps keyboard navigation (arrow keys, selection toggles, select-all) and the currently focused/selected rows working correctly when the backing data array is rebuilt with new object instances (e.g. after a refetch), instead of silently breaking because the held references no longer exist in the new array.

**Usage:**

```typescript
import { CollectionService } from '@furystack/shades-common-components'

interface User {
  id: string
  name: string
}

const service = new CollectionService<User>({ idField: 'id' })

service.data.setValue({ count: users.length, entries: users })
service.focusedEntry.setValue(users[1])

// Later, after a refetch that returns new object instances with the same ids:
service.data.setValue({ count: refetched.length, entries: refetched })

// focusedEntry and selection now point at the matching entries in `refetched`
// instead of the stale objects from the previous data set.
```

Entries whose id is no longer present in the new data are dropped from `selection`, and `focusedEntry` is cleared if its id disappeared. The feature is opt-in: if `idField` is not set, the previous behavior is preserved unchanged.

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

- Added unit tests for `CollectionService` `idField` reconciliation, covering `focusedEntry` and `selection` updates on data changes, removal of stale entries, no-op behavior when `idField` is absent, reference-equality short-circuit, and end-to-end keyboard navigation after a data refresh.

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->

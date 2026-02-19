<!-- version-type: minor -->

# @furystack/core

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## ✨ Features

### `SystemIdentityContext` -- elevated identity for trusted server-side operations

Added `SystemIdentityContext`, an `IdentityContext` subclass that is always authenticated and authorized. It is intended for background jobs, migrations, and seed scripts that need to write through the `DataSet` layer without an HTTP user session.

Also added the `useSystemIdentityContext()` helper that creates a scoped child injector with the elevated context. The returned injector is `AsyncDisposable` and works with `usingAsync()` for automatic cleanup.

**Usage:**

```typescript
import { useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'

await usingAsync(useSystemIdentityContext({ injector, username: 'migration-job' }), async (systemInjector) => {
  const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
  await dataSet.add(systemInjector, newEntity)
})
```

## 📚 Documentation

- Expanded JSDoc on `PhysicalStore` to warn that writing directly to the store bypasses DataSet authorization, hooks, and events

## 🧪 Tests

- Added tests for `SystemIdentityContext` (authentication, authorization, custom username)
- Added tests for `useSystemIdentityContext` (child injector scoping, disposal, identity resolution)

## ⬆️ Dependencies

- Updated `@furystack/inject` and `@furystack/utils`

<!-- version-type: minor -->

# @furystack/core

## ✨ Features

### Public `filterItems()` function

Extracted the filter logic from `InMemoryStore` into a standalone `filterItems()` function, now exported from `@furystack/core`. This allows consumers to filter arrays using `FilterType` expressions without needing a store instance.

**Usage:**

```typescript
import { filterItems } from '@furystack/core'

const results = filterItems(myArray, {
  name: { $startsWith: 'foo' },
  age: { $gte: 18 },
})
```

## ♻️ Refactoring

- `InMemoryStore` now delegates to the public `filterItems()` function internally instead of using a private method

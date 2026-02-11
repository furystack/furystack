<!-- version-type: minor -->
# @furystack/shades-common-components

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

### New `CacheView` component

Added a new `CacheView` component that renders the state of a cache entry. It subscribes to a `Cache` instance observable and handles all states automatically:

1. **Error first** — shows error UI with a retry button
2. **Value next** — renders the content component (triggers reload when obsolete)
3. **Loading last** — shows a custom loader or nothing by default

```tsx
import { CacheView } from '@furystack/shades-common-components'

<CacheView cache={userCache} args={[userId]} content={UserContent} />

// With custom loader and error UI
<CacheView
  cache={userCache}
  args={[userId]}
  content={UserContent}
  loader={<Skeleton />}
  error={(err, retry) => (
    <Alert severity="error">
      <Button onclick={retry}>Retry</Button>
    </Alert>
  )}
/>
```

## 🐛 Bug Fixes

- Fixed `Skeleton` component background styles not rendering correctly when used inside Shadow DOM — moved gradient styles from host CSS to inline styles on the inner element

## 📚 Documentation

- Added `CacheView` usage examples to the package README

## ⬆️ Dependencies

- Added `@furystack/cache` (workspace:^) as a new dependency

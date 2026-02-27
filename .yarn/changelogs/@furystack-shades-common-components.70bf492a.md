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

### `contentProps` support for `CacheView`

`CacheView` now accepts a `contentProps` prop to forward additional type-safe props to the content component beyond `data`. The `CacheViewProps` type gained a third generic parameter `TContentProps` that constrains the content component's full props shape. When the content component requires extra props (excluding `data` and HTML element attributes), `contentProps` becomes required; otherwise it can be omitted.

**Usage:**

```tsx
const MyContent = Shade<{ data: CacheWithValue<User>; label: string }>({
  shadowDomName: 'my-content',
  render: ({ props }) => <div>{props.label}: {props.data.value.name}</div>,
})

<CacheView
  cache={userCache}
  args={[userId]}
  content={MyContent}
  contentProps={{ label: 'User' }}
/>
```

## 🧪 Tests

- Added tests for `contentProps` forwarding to the content component

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->

<!-- version-type: major -->

# @furystack/shades

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

## 💥 Breaking Changes

### Removed `constructed` callback from `Shade()`

The `constructed` option has been removed from the `Shade()` component definition. The `callConstructed()` method has also been removed from the `JSX.Element` interface. Any cleanup function returned by `constructed` is no longer supported.

**Migration:** Move initialization logic into `render` using `useDisposable()` for one-time setup that needs cleanup.

```typescript
// ❌ Before
const MyComponent = Shade({
  shadowDomName: 'my-component',
  constructed: ({ element }) => {
    const listener = () => { /* ... */ }
    window.addEventListener('click', listener)
    return () => window.removeEventListener('click', listener)
  },
  render: () => <div>Hello</div>,
})

// ✅ After
const MyComponent = Shade({
  shadowDomName: 'my-component',
  render: ({ element, useDisposable }) => {
    useDisposable('click-handler', () => {
      const listener = () => { /* ... */ }
      window.addEventListener('click', listener)
      return { [Symbol.dispose]: () => window.removeEventListener('click', listener) }
    })
    return <div>Hello</div>
  },
})
```

**Impact:** All components using the `constructed` callback must be updated.

## 📚 Documentation

- Updated README to remove references to `constructed` and `initialState`, and to recommend `useDisposable` for one-time setup with cleanup

## 🧪 Tests

- Updated unit and integration tests to use `updateComponent()` instead of the removed `callConstructed()`
- Replaced `constructed` callback test with `useDisposable` cleanup test

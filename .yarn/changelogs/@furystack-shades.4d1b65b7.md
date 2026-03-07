<!-- version-type: major -->

# @furystack/shades

## 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName`

The `shadowDomName` property in `ShadeOptions` has been renamed to `customElementName` to accurately reflect its purpose — it defines a Custom Element tag name, not a Shadow DOM name.

**Examples:**

```typescript
// ❌ Before
const MyComponent = Shade({
  shadowDomName: 'my-component',
  render: () => <div>Hello</div>,
})

// ✅ After
const MyComponent = Shade({
  customElementName: 'my-component',
  render: () => <div>Hello</div>,
})
```

**Impact:** All `Shade()` calls in your codebase must be updated.

**Migration:** Use the `furystack/no-removed-shade-apis` ESLint rule which now detects `shadowDomName` usage and provides an auto-fix to rename it to `customElementName`. Alternatively, search and replace `shadowDomName` → `customElementName` across your project.

## ♻️ Refactoring

- Renamed internal `shadowDomName` references to `customElementName` in `StyleManager.registerComponentStyles()`, `StyleManager.isRegistered()`, and `generateCSS()` parameter names

## 📚 Documentation

- Updated README examples to use `customElementName` instead of `shadowDomName`

## 🧪 Tests

- Updated all test files to use the new `customElementName` property

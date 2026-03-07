<!-- version-type: major -->

# @furystack/shades-i18n

## 💥 Breaking Changes

### `createI18nComponent` option `shadowDomName` renamed to `customElementName`

The `createI18nComponent()` function now accepts `customElementName` instead of `shadowDomName` in its options object.

**Examples:**

```typescript
// ❌ Before
const I18n = createI18nComponent({
  service,
  shadowDomName: 'i18n-translated',
})

// ✅ After
const I18n = createI18nComponent({
  service,
  customElementName: 'i18n-translated',
})
```

## 📚 Documentation

- Updated README examples to use `customElementName`

## 🧪 Tests

- Updated all test cases to use the new `customElementName` property

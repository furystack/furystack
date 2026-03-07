<!-- version-type: major -->

# @furystack/shades-mfe

## 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName` in Shade component API

The `MicroFrontend` component and all Shade components created with `createShadesMicroFrontend()` now use `customElementName` instead of `shadowDomName`. This is a breaking change inherited from `@furystack/shades`.

**Examples:**

```typescript
// ❌ Before
const MyMfeComponent = Shade<MyMfeApi>({
  shadowDomName: 'my-mfe-component',
  render: ({ props }) => <div>{props.greeting}</div>,
})

// ✅ After
const MyMfeComponent = Shade<MyMfeApi>({
  customElementName: 'my-mfe-component',
  render: ({ props }) => <div>{props.greeting}</div>,
})
```

## 📚 Documentation

- Updated README examples to use `customElementName`

## 🧪 Tests

- Updated all test cases to use the new `customElementName` property

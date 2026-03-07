<!-- version-type: major -->

# @furystack/shades-common-components

## 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName`

All components now use `customElementName` instead of `shadowDomName`, following the upstream `@furystack/shades` rename.

### `CircularProgress` and `LinearProgress` `value` prop changed from `ObservableValue<number>` to `number`

The `value` prop on `CircularProgress` and `LinearProgress` no longer accepts an `ObservableValue<number>`. Pass a plain `number` instead and use `useObservable` at the call site to reactively update the value.

**Examples:**

```typescript
// ❌ Before
<CircularProgress value={progressObservable} variant="determinate" />

// ✅ After
const [progress] = useObservable('progress', progressObservable)
<CircularProgress value={progress} variant="determinate" />
```

### `DataGrid`, `DataGridHeader`, `DataGridFooter`, and filter components: `findOptions` changed from `ObservableValue` to plain value with `onFindOptionsChange` callback

The `findOptions` prop on `DataGrid`, `DataGridHeader`, `DataGridFooter`, `OrderButton`, and all filter components (`StringFilter`, `NumberFilter`, `BooleanFilter`, `DateFilter`, `EnumFilter`) no longer accepts an `ObservableValue<FindOptions>`. Pass a plain `FindOptions` object along with a new `onFindOptionsChange` callback to handle state updates.

**Examples:**

```typescript
// ❌ Before
const findOptions = new ObservableValue({ top: 10, skip: 0 })
<DataGrid findOptions={findOptions} ... />

// ✅ After
const [findOptions, setFindOptions] = useObservable('findOptions', findOptionsObservable)
<DataGrid
  findOptions={findOptions}
  onFindOptionsChange={setFindOptions}
  ...
/>
```

**Impact:** All consumers of `DataGrid` and its sub-components must be updated to provide `findOptions` as a plain object and supply the `onFindOptionsChange` callback.

## 📚 Documentation

- Updated README examples to use `customElementName` and the new `onFindOptionsChange` pattern

## 🧪 Tests

- Updated all component tests to use `customElementName` and the new prop signatures

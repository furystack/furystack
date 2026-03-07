<!-- version-type: major -->

# @furystack/shades-showcase-app

## 💥 Breaking Changes

### Migrated to new `customElementName` Shade API

All showcase components updated from `shadowDomName` to `customElementName`, following the `@furystack/shades` rename.

### Migrated to new `DataGrid` `onFindOptionsChange` callback pattern

Showcase pages using `DataGrid` now pass `findOptions` as a plain object with an `onFindOptionsChange` callback instead of wrapping them in an `ObservableValue`.

### Migrated `CircularProgress` and `LinearProgress` to plain `number` values

Showcase pages using progress components now pass `value` as a plain `number` instead of an `ObservableValue<number>`.

## ♻️ Refactoring

- Updated all ~100+ showcase components and pages to use the new APIs

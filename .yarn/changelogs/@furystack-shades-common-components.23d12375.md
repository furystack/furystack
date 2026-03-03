<!-- version-type: minor -->

# @furystack/shades-common-components

## 🗑️ Deprecated

- `CollectionServiceOptions.onRowClick` — use `subscribe('onRowClick', ...)` on the `CollectionService` instance instead
- `CollectionServiceOptions.onRowDoubleClick` — use `subscribe('onRowDoubleClick', ...)` on the `CollectionService` instance instead

## ♻️ Refactoring

- `CollectionService` now extends `EventHub` and routes row click/double-click through `onRowClick` and `onRowDoubleClick` events, enabling multiple subscribers

## 🧪 Tests

- Added tests for `onRowClick` and `onRowDoubleClick` event emission

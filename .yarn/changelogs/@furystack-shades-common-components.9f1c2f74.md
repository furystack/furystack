<!-- version-type: minor -->

# @furystack/shades-common-components

## 🗑️ Deprecated

- `Grid` component is deprecated in favor of `DataGrid`. It will be removed in a future version.
- `Autocomplete` component is deprecated in favor of `Suggest` with the `suggestions` prop. It will be removed in a future version.

## ✨ Features

### Pagination support for `List` component

The `List` component now accepts an optional `pagination` prop to slice items into pages and render a `Pagination` control below the list.

**Usage:**

```typescript
<List
  items={allItems}
  listService={service}
  renderItem={(item) => <span>{item.name}</span>}
  pagination={{ itemsPerPage: 10, page: currentPage, onPageChange: setCurrentPage }}
/>
```

### Synchronous suggestions mode for `Suggest`

`Suggest` now supports a synchronous `suggestions` prop accepting a `string[]`, in addition to the existing async `getEntries` / `getSuggestionEntry` mode. The list is filtered client-side by the search term.

**Usage:**

```typescript
<Suggest
  defaultPrefix="🔍"
  suggestions={['Apple', 'Banana', 'Cherry']}
  onSelectSuggestion={(entry) => console.log(entry)}
/>
```

### `Wizard` step indicator and progress bar

The `Wizard` component now supports a `stepLabels` prop to render a visual step indicator with numbered circles and labels, and a `showProgress` prop to display a progress bar that advances as the user navigates through steps.

### `MarkdownInput` form integration

`MarkdownInput` now supports `name`, `required`, `getValidationResult`, and `getHelperText` props, enabling validation and `FormService` integration. Invalid states are reflected via a `data-invalid` attribute with error styling.

### Customizable `DataGrid` pagination options

- Added a `paginationOptions` prop to `DataGrid` to customize the rows-per-page selector values. When only one option is provided, the selector is hidden.
- Made the `styles` prop optional on `DataGrid`

## ♻️ Refactoring

- `DataGridFooter` now uses the `Pagination` component instead of a `<select>` element for page navigation

## 🧪 Tests

- Added pagination tests for the `List` component (page slicing, `Pagination` rendering, `onPageChange` callback)
- Added form integration and validation tests for `MarkdownInput` (`name`, `required`, `getValidationResult`, `getHelperText`)
- Added synchronous suggestions mode tests for `Suggest`
- Added step indicator and progress bar tests for `Wizard`
- Added custom `paginationOptions` tests for `DataGridFooter`

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

### Typed Column Filters for DataGrid

Added a new filter system for `DataGrid` with dedicated filter components for each data type, replacing the previous inline regex-only search form.

New `columnFilters` prop on `DataGrid` allows declarative filter configuration per column:

```typescript
<DataGrid
  columns={['name', 'level', 'isActive', 'role', 'createdAt']}
  columnFilters={{
    name: { type: 'string' },
    level: { type: 'number' },
    isActive: { type: 'boolean' },
    role: { type: 'enum', values: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] },
    createdAt: { type: 'date' },
  }}
  // ...other props
/>
```

**Available filter types:**

- `StringFilter` - supports contains, starts with, ends with, and exact match operators
- `NumberFilter` - supports `=`, `>`, `>=`, `<`, `<=` comparison operators
- `BooleanFilter` - toggle between true, false, or any using a `SegmentedControl`
- `EnumFilter` - multi-select checkboxes with include/exclude modes
- `DateFilter` - before, after, or between with datetime-local inputs

All filter components are exported from `@furystack/shades-common-components` via the `filters/` barrel.

- Added `FilterDropdown` component for positioning filter panels as dropdown overlays in the grid header
- `headerComponents` and `rowComponents` props on `DataGrid` are now optional
- `ToggleButton` now accepts `pressed` and `size` props for standalone use outside a `ToggleButtonGroup`
- `ToggleButtonGroup` now accepts a `size` prop that propagates to child buttons

## ♻️ Refactoring

- Grid header height reduced from 48px to 36px with smaller font and tighter spacing for a more compact look
- Footer pager labels changed from "Goto page" / "Show X items per page" to "Page X of Y" / "Rows per page"
- `ToggleButton` no longer renders a box-shadow by default; the border is only applied when inside a `ToggleButtonGroup` (via `data-grouped` attribute)

## ⚠️ Migration

- Column filter buttons are now **opt-in** via the `columnFilters` prop. Previously, every column showed a regex search button by default. To restore filtering, add a `columnFilters` config mapping for the columns you want to be filterable.

## 🧪 Tests

- Added unit tests for `ToggleButton` standalone `pressed` and `size` props
- Added unit tests for `ToggleButtonGroup` `size` propagation to child buttons
- Updated `DataGridHeader` tests to cover filter button visibility, filter type routing for all five filter types, and dropdown opening
- Updated `DataGridFooter` tests to match new pager label text

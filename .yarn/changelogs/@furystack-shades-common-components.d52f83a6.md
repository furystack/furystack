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

### Unified `ComponentSize` type

Added a shared `ComponentSize` type (`'small' | 'medium' | 'large'`) exported from the package. All components that support sizing now reference this single type instead of individual inline union types, ensuring consistency across the component library.

### `size` prop on form controls

The following form controls now accept a `size` prop for density control:

- **Input** — adjusts label padding, input font size, and icon size
- **Select** — adjusts label padding, trigger font size, and dropdown item sizing
- **InputNumber** — adjusts label padding, input font size, and stepper button dimensions
- **TextArea** — adjusts label padding and content font size
- **Checkbox** — adjusts control box dimensions (`16px` / `20px` / `24px`) and label font size
- **Radio** — adjusts control circle dimensions and label font size

All default to `'medium'` with no visual changes for existing consumers.

### `large` size added to Chip, Switch, and SegmentedControl

These components previously only supported `'small' | 'medium'`. They now also accept `'large'` for better alignment with other components in dense or spacious layouts.

### `RouteBreadcrumb` component

Added a reusable `RouteBreadcrumb` component that automatically derives breadcrumb items from the current `RouteMatchService` match chain. It resolves route titles (including async resolvers) from `meta.title` and accumulates path segments to produce correct links.

```tsx
<RouteBreadcrumb homeItem={{ path: '/', label: <Icon icon={icons.home} size="small" /> }} separator=" › " />
```

### Horizontal Timeline orientation

The `Timeline` component now accepts an `orientation` prop (`'vertical' | 'horizontal'`). Horizontal mode supports all existing `mode` values (`'left'`, `'right'`, `'alternate'`) as well as the `pending` indicator, rendering items in a row with a horizontal connector line.

## 🧪 Tests

- Added `size` prop tests (`small`, `medium`, `large`, unset) for Checkbox, Radio, Switch, Input, InputNumber, TextArea, and Select
- Added `large` size test for Chip and SegmentedControl
- Added tests for the new `RouteBreadcrumb` component covering route resolution, async titles, `skipRootPath`, `homeItem`, `separator`, and observable-driven updates

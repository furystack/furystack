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

## 🗑️ Deprecated

<!-- PLACEHOLDER: Describe deprecated features. Double-check if they are annotated with a `@deprecated` jsdoc tag. -->

## ✨ Features

### Unified `ComponentSize` type

Added a shared `ComponentSize` type (`'small' | 'medium' | 'large'`) exported from the package. All components that support sizing now use this type instead of individual inline union types, ensuring consistency across the component library.

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

## 🐛 Bug Fixes

<!-- PLACEHOLDER: Describe the nasty little bugs that has been eradicated (fix:) -->

## 📚 Documentation

<!-- PLACEHOLDER: Describe documentation changes (docs:) -->

## ⚡ Performance

<!-- PLACEHOLDER: Describe performance improvements (perf:) -->

## ♻️ Refactoring

<!-- PLACEHOLDER: Describe code refactoring (refactor:) -->

## 🧪 Tests

<!-- PLACEHOLDER: Describe test changes (test:) -->

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->

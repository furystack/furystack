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

### MarkdownEditor Form Integration

`MarkdownEditor` now accepts form-related props forwarded from `MarkdownInputProps`, enabling direct use inside forms with validation and labeling support.

**New props:** `name`, `required`, `labelTitle`, `disabled`, `placeholder`, `rows`, `getValidationResult`, `getHelperText`

**Usage:**

```tsx
<MarkdownEditor
  value={description}
  onValueChange={setDescription}
  labelTitle="Description"
  name="description"
  required
  getValidationResult={({ value }) =>
    value.length < 10 ? { isValid: false, message: 'Must be at least 10 characters' } : { isValid: true }
  }
/>
```

The editor renders a label above the editing area, displays validation errors and helper text below it, and sets a `data-invalid` attribute on the host element when validation fails — allowing external styling of the invalid state.

### MarkdownInput `hideChrome` Prop

- Added `hideChrome` prop to `MarkdownInput` — when `true`, suppresses the label and helper text rendering while preserving form semantics (textarea `name`, `required`, etc.). This is used internally by `MarkdownEditor` to avoid duplicate chrome when it manages its own label and validation display.

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

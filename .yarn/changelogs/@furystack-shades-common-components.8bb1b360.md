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

### Async form submission support

The `Form` component's `onSubmit` callback now accepts async functions (`() => void | Promise<void>`). A new `isSubmitting` observable on `FormService` tracks whether a submission is in progress. When the `disableOnSubmit` prop is enabled, the form element becomes inert during submission, preventing duplicate submits.

**Usage:**

```typescript
<Form
  validate={myValidator}
  onSubmit={async (data) => {
    await saveToServer(data)
  }}
  disableOnSubmit
>
  {/* form fields */}
</Form>
```

## ♻️ Refactoring

- Changed the `validate` prop type from `any` to `unknown` for stricter type safety

## 🧪 Tests

- Added tests for async `onSubmit` behavior, `isSubmitting` state tracking, `disableOnSubmit` inert toggling, and error handling during async submission

## 📦 Build

<!-- PLACEHOLDER: Describe build system changes (build:) -->

## 👷 CI

<!-- PLACEHOLDER: Describe CI configuration changes (ci:) -->

## ⬆️ Dependencies

<!-- PLACEHOLDER: Describe dependency updates (deps:) -->

## 🔧 Chores

<!-- PLACEHOLDER: Describe other changes (chore:) -->

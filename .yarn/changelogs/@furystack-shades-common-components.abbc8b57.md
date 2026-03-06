<!-- version-type: patch -->

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

### Contained mode for `PageLayout`

Added a `contained` prop to `PageLayout` that uses `position: absolute` instead of `position: fixed`, allowing the layout to fill its nearest positioned ancestor rather than the viewport. This enables nesting multiple `PageLayout` instances on the same page (e.g. in a showcase grid or dashboard).

**Usage:**

```tsx
<div style={{ position: 'relative', height: '400px' }}>
  <PageLayout contained appBar={{ variant: 'permanent', component: <MyAppBar /> }}>
    <div>Scoped content</div>
  </PageLayout>
</div>
```

## ♻️ Refactoring

- Scoped `PageLayout` internal CSS selectors to direct children (`> * >`) to prevent styles from bleeding into nested `PageLayout` instances
- `PageContainer` now uses theme spacing tokens (`cssVariableTheme.spacing.md`) for default `padding` and `gap` instead of hardcoded pixel values

## 🧪 Tests

- Added unit tests for `PageLayout` contained mode covering data attribute binding, absolute positioning, drawer toggle, and backdrop click behavior

<!-- version-type: patch -->

# @furystack/shades

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

## ⚡ Performance

### Synchronous child reconciliation

Child Shade component updates during parent-to-child reconciliation are now performed synchronously via a new `updateComponentSync()` method. This eliminates cascading microtask ticks when a parent re-render propagates props to child components, settling the entire component tree in a single call frame. A single `await flushUpdates()` is now sufficient to settle the full tree after a state change.

- Host props are now applied before patching children, allowing child components rendered synchronously to discover parent state (e.g. injector) via `getInjectorFromParent()` immediately

## 🧪 Tests

- Replaced `sleepAsync()` with `flushUpdates()` across all component tests for deterministic, timing-independent assertions

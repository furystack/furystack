<!-- version-type: patch -->

# @furystack/repository

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

## 📚 Documentation

- Expanded JSDoc on `DataSet` class to explain its role as the authorized write gateway with event dispatching
- Expanded JSDoc on `add()`, `update()`, and `remove()` to document authorization checks, hooks, and emitted events
- Expanded JSDoc on `getDataSetFor()` with usage examples for server-side writes using `useSystemIdentityContext`
- Added README section covering server-side writes with the elevated `IdentityContext`, including a warning about bypassing the DataSet layer

## ⬆️ Dependencies

- Updated `@furystack/core`

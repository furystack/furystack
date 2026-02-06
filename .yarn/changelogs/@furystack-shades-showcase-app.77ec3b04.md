<!-- version-type: patch -->

# @furystack/shades-showcase-app

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

## ♻️ Refactoring

- Extracted route definitions from `app.tsx` into a dedicated `routes.tsx` module
- Migrated from flat `Router` to the new `NestedRouter` component, using a shared layout route with an `outlet` for page content

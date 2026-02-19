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

## ✨ Features

- Added `navigate(path)` method to `LocationService` for programmatic SPA routing. It calls `history.pushState` and updates the internal routing state in a single step, replacing the need to call `history.pushState` and manually trigger state updates.

## ⬆️ Dependencies

- Updated `@furystack/inject` and `@furystack/utils`

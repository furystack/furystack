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

## ✨ Features

- Added size variant demos (`small` / `medium` / `large`) to the Input, InputNumber, Select, Checkbox, and Radio showcase pages
- Added horizontal Timeline examples (basic, colored, labeled, custom dots, pending) to the Timeline showcase page
- Added `large` Switch demo to the Switch showcase page

## ♻️ Refactoring

- Replaced the hand-rolled breadcrumb logic in `ShowcaseBreadcrumbComponent` with the new `RouteBreadcrumb` component from `@furystack/shades-common-components`

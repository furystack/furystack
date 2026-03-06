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

- Added Layout Showcase page with interactive examples of different `PageLayout` configurations — AppBar variants, permanent/collapsible/temporary drawers, auto-hide behavior, and dual-drawer layouts

## ♻️ Refactoring

- Updated `PageLoader` to use `PageContainer` and `Paper` components for a more structured loading skeleton
- Adjusted `ShowcaseAppBar` to inherit height from parent layout and simplified divider styling
- Removed `topGap` from `ShowcaseLayout` for consistent spacing
- Changed the default Layout category route from `/layout/divider` to `/layout/layout-showcase`

## 🧪 Tests

- Updated e2e navigation tests to include the new Layout Showcase page
- Updated e2e snapshots to reflect layout and styling changes

<!-- version-type: major -->

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

## 💥 Breaking Changes

- `AppBarLink` props changed from `RouteLinkProps` to `NestedRouteLinkProps` — `href` is now required and the rendered shadow DOM element changed from `route-link` to `nested-route-link`

## ♻️ Refactoring

- Migrated `AppBarLink` from the deprecated `RouteLink` to `NestedRouteLink` for SPA navigation

## 🧪 Tests

- Refactored tests across all components (AppBar, Button, CommandPalette, DataGrid, Drawer, Fab, Form, Grid, Input, TextArea, Loader, NotyList, PageLayout, Paper, Skeleton, Suggest, Wizard) to use `usingAsync` for proper `Injector` disposal

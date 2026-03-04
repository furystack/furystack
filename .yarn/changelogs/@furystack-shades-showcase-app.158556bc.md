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

- Added `meta` objects with `title` and `icon` to all route definitions, enabling automatic breadcrumbs, document title, and sidebar navigation from route metadata
- Added `DocumentTitleUpdater` component that reactively updates `document.title` from the current route match chain (e.g. "FuryStack Shades / Data Display / Icons")
- Added `route-meta-augmentation.ts` to extend `NestedRouteMeta` with an `icon` field via declaration merging

## ♻️ Refactoring

- Refactored `ShowcaseAppBar` to derive top-level nav links from `extractNavTree()` instead of a manually maintained navigation config
- Refactored `ShowcaseBreadcrumbComponent` to resolve breadcrumb items from `RouteMatchService` and `resolveRouteTitles()`, removing hardcoded path-to-label mappings
- Refactored `SidebarNavigation` to build the sidebar tree from `extractNavTree()`, keeping navigation in sync with route definitions automatically

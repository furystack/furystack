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

### Restructured showcase app into category-based page hierarchy

Replaced the monolithic `misc.tsx` (435 lines) with dedicated page components organized into category subdirectories matching the navigation structure:

- `data-display/` - Avatar, Breadcrumb, List, Tree pages (Grid was moved from top-level)
- `navigation/` - Context Menu, Command Palette, Suggest pages (Tabs was moved from top-level)
- `feedback/` - Notifications page (renamed from `notys.tsx`)
- `surfaces/` - FAB page (Wizard was moved from top-level)
- `inputs-and-forms/` - Buttons, Inputs, Form pages (moved from top-level)
- `integrations/` - Monaco, Lottie, Nipple, MFE, I18N pages (moved from top-level)
- `utilities/` - Search State, Stored State pages (extracted from `misc.tsx`)

### Centralized navigation config as a single source of truth

Added `navigation.ts` with a typed `navigationConfig` array that drives the sidebar tree, AppBar category links, breadcrumb generation, and route definitions — removing duplicated navigation data across components.

### Added `SidebarNavigation` component

New collapsible sidebar with expandable category sections, active-page highlighting, and auto-expand on navigation.

### Improved breadcrumb generation

`ShowcaseBreadcrumbComponent` now derives breadcrumb items automatically from `navigationConfig` via `findNavItemByPath()` instead of maintaining a separate mapping.

### Added `Navigate` redirect helper

New lightweight component that redirects to a target path using `history.replaceState`, used for category index routes (e.g. `/data-display` redirects to `/data-display/grid`).

### Updated `ShowcaseAppBar` to use navigation config

AppBar category links are now generated from `navigationConfig` instead of being hardcoded.

## 🧪 Tests

- Reorganized e2e tests into category-based subdirectories (`data-display/`, `navigation/`, `inputs-and-forms/`, `feedback/`, `surfaces/`, `integrations/`, `utilities/`, `layout-tests/`) matching the new page structure
- Added new e2e tests for Avatar, Breadcrumb, List, Tree, Buttons, Inputs, Context Menu, Command Palette, Suggest, Tabs, FAB, Monaco, Nipple, Search State, and Stored State pages
- Updated e2e snapshot baselines for the new page layouts

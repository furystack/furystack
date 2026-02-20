# Changelog

## [8.0.5] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [8.0.4] - 2026-02-19

### ✨ Features

- Added Markdown showcase page at `/integrations/markdown` demonstrating `MarkdownDisplay`, `MarkdownInput`, and `MarkdownEditor` with interactive checkboxes and layout switching

### 🧪 Tests

- Added E2E tests for the Markdown showcase page covering display rendering, checkbox toggling, editor layout switching, and input visibility

## [8.0.3] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/shades` and `@furystack/shades-common-components`

### ✨ Features

### Icon gallery now auto-discovers icons with search and filtering

The icons showcase page no longer uses a hardcoded list of icons. It dynamically reads all exported icons and groups them by their `category` metadata. A search input lets users filter icons by name, keyword, description, or category, displaying a live count of matches.

### Replaced emoji strings with `Icon` components across the app

Navigation categories, sidebar branding, breadcrumb home link, theme switcher, page headers, and the 404 page now render proper `Icon` components instead of emoji characters. The `NavCategory.icon` type changed from `string` to `IconDefinition`.

### ♻️ Refactoring

- Replaced inline-styled toggle buttons in the icons page with `ToggleButtonGroup` and `Button` components
- Extracted size-comparison section into a data-driven `.map()` loop
- Reorganized imports across ~50 showcase pages to group `@furystack/*` imports consistently

## [8.0.2] - 2026-02-11

### ✨ Features

- New page for the new `<CacheView />` component

### ⬆️ Dependencies

- Added `@furystack/cache` (workspace:^) as a new dependency

## [8.0.1] - 2026-02-11

### ⬆️ Dependencies

- Bump `@playwright/test` from `^1.57.0` to `^1.58.2`
- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/shades` dependency
- Updated internal dependencies
- Updated `@furystack/shades` with fix for `useState` setter disposal error

## [8.0.0] - 2026-02-09

### ✨ Features

### Showcase pages for Component Pack 1

Added interactive demo pages for all 15 new components, organised into the existing navigation categories:

- **Data Display:** Accordion, Badge, Chip, Tooltip
- **Feedback:** Alert, Progress (circular + linear)
- **Surfaces:** Card, Dialog
- **Layout:** Divider
- **Navigation:** Pagination
- **Inputs & Forms:** Checkboxes, Radio, Select, Switch

### Advanced form demo

Extended the Form showcase page with an advanced section demonstrating `Radio`, `RadioGroup`, `Select`, `Checkbox`, and `Switch` components working together with `FormService` validation.

### Layout Test Pages

Added demonstration pages for the new layout system components:

- **AppBar Only** - Basic layout with permanent AppBar
- **AppBar with Left Drawer** - Layout with collapsible left drawer
- **AppBar with Right Drawer** - Layout with collapsible right drawer
- **AppBar with Both Drawers** - Layout with both left and right drawers
- **Collapsible Drawer** - Demonstrates drawer toggle functionality
- **Auto-Hide AppBar** - AppBar that hides on scroll and shows on hover
- **Responsive Layout** - Layout that adapts to screen size breakpoints

- Added `ListShowcase` demo on the Misc page showcasing basic and multi-select list usage with selection count display
- Added `TreeShowcase` demo on the Misc page showcasing a file system tree with expand/collapse and keyboard navigation
- Added `ContextMenuShowcase` demo on the Misc page showcasing right-click and button-triggered context menus with icons, descriptions, separators, and disabled items
- Added `ShowcaseBreadcrumbComponent` to display current page navigation in the app bar
- Added breadcrumb usage examples to the Misc page demonstrating basic, multi-item, custom separator, custom rendering, type-safe, and non-clickable last item variations
- Added showcase pages for all new components: `Carousel`, `Image`, `Timeline`, `Typography`, `Result`, `ButtonGroup`, `InputNumber`, `Rating`, `Slider`, `Dropdown`, `Menu`, and `Tabs`
- Updated routes and navigation sidebar with new component categories (Data Display, Feedback, Navigation)

### ♻️ Refactoring

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

- Reorganised sidebar navigation categories to match the expanded component set (Data Display, Feedback, Surfaces, Layout, Navigation, Inputs & Forms)
- Updated `ShowcaseAppBar` to use `spacing.*` tokens instead of hardcoded pixel values for padding and margins
- Updated `SidebarNavigation` to use `shape.borderRadius.*`, `transitions.*`, `action.*`, and `typography.*` theme tokens instead of hardcoded values
- Migrated showcase app pages to use the new `PageLayout` and `PageContainer` components
- Migrated `MonacoEditor` component from `constructed` to `useDisposable()` in `render` for editor initialization and cleanup
- Migrated `Navigate` component from `constructed` to `useDisposable()` in `render` for location observer setup
- Migrated `ProgressPage` and `HomeWizard` components from `constructed` to `useDisposable()` in `render`
- Extracted route definitions from `app.tsx` into a dedicated `routes.tsx` module
- Migrated from flat `Router` to the new `NestedRouter` component, using a shared layout route with an `outlet` for page content
- Migrated all page components from imperative `element` manipulation to declarative `useHostProps` and `useRef`
- Updated form page with restructured form examples and fieldset usage
- Updated button-group, input-number, radio, slider, switch, and other input pages
- Updated dialog, wizard, menu, dropdown, and tabs navigation pages
- Updated progress feedback page
- Updated Monaco editor component integration
- Updated nipple integration page
- Updated routes component

### 🧪 Tests

- Added e2e tests for all new showcase pages: accordion, alert, badge, card, chip, progress, checkboxes, radio, select, switch, divider, pagination, dialog, and tooltip
- Extended form e2e tests covering advanced form inputs and validation
- Updated navigation e2e tests and visual regression snapshots for the new navigation structure
- Added E2E tests for layout components with visual snapshot testing across browsers
- Fixed DataGrid E2E tests for keyboard navigation
- Updated e2e tests for form, grid, list, layout, and wizard pages to accommodate rendering changes
- Updated visual snapshot baselines for form fieldset tests
- Reorganized e2e tests into category-based subdirectories (`data-display/`, `navigation/`, `inputs-and-forms/`, `feedback/`, `surfaces/`, `integrations/`, `utilities/`, `layout-tests/`) matching the new page structure
- Added new e2e tests for Avatar, Breadcrumb, List, Tree, Buttons, Inputs, Context Menu, Command Palette, Suggest, Tabs, FAB, Monaco, Nipple, Search State, and Stored State pages
- Updated e2e snapshot baselines for the new page layouts
- Added e2e tests for all new showcase pages and enhanced component demos

### 💥 Breaking Changes

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback from the Shade API.

### Updated for New Shades Rendering Engine

All showcase pages and components have been updated to use the new `useHostProps` and `useRef` APIs, replacing the removed `element` render option.

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency with microtask-based batched rendering
- Updated `@furystack/shades` and related packages to new major versions

## [7.1.0] - 2026-02-01

### ♻️ Refactoring

- Updated page components to use refactored `@furystack/shades-common-components` with new `css` property styling
- Simplified `PageLoader` component styling

## [7.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [7.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [7.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system

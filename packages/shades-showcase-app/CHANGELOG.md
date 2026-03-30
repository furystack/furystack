# Changelog

## [9.1.5] - 2026-03-30

### ✨ Features

- Added size variant demos (`small` / `medium` / `large`) to the Input, InputNumber, Select, Checkbox, and Radio showcase pages
- Added horizontal Timeline examples (basic, colored, labeled, custom dots, pending) to the Timeline showcase page
- Added `large` Switch demo to the Switch showcase page

### ♻️ Refactoring

- Replaced the hand-rolled breadcrumb logic in `ShowcaseBreadcrumbComponent` with the new `RouteBreadcrumb` component from `@furystack/shades-common-components`

## [9.1.4] - 2026-03-27

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [9.1.3] - 2026-03-27

### 🐛 Bug Fixes

- Updated the Nipple integration page to read joystick output from `event.data`, so live output rendering matches the current `@furystack/shades-nipple` callback payload.

### ⬆️ Dependencies

- Updated `@furystack/cache` with cache timer fixes
- Updated `@furystack/shades` dependency

## [9.1.2] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility
- Removed `DOM.Iterable` from `lib` in tsconfig.json (merged into `DOM` in TypeScript 6)

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `vite` from ^8.0.0 to ^8.0.2

## [9.1.1] - 2026-03-19

### ✨ Features

- Added Spatial Navigation showcase page demonstrating section‑scoped arrow‑key navigation, focus traps, input passthrough, and an action log.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- 9.1.0 patch: updated `@furystack/core` dependency to the new major version.

## [9.1.0] - 2026-03-10

### ✨ Features

- Added Spatial Navigation showcase page under Navigation demonstrating section-scoped arrow-key navigation, cross-section movement, input passthrough, focus-trapped dialogs, and an action log

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [9.0.0] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### Migrated to new `customElementName` Shade API

All showcase components updated from `shadowDomName` to `customElementName`, following the `@furystack/shades` rename.

### Migrated to new `DataGrid` `onFindOptionsChange` callback pattern

Showcase pages using `DataGrid` now pass `findOptions` as a plain object with an `onFindOptionsChange` callback instead of wrapping them in an `ObservableValue`.

### Migrated `CircularProgress` and `LinearProgress` to plain `number` values

Showcase pages using progress components now pass `value` as a plain `number` instead of an `ObservableValue<number>`.

### ♻️ Refactoring

- Updated all ~100+ showcase components and pages to use the new APIs

## [8.2.8] - 2026-03-06

### ✨ Features

- Added Layout Showcase page with interactive examples of different `PageLayout` configurations — AppBar variants, permanent/collapsible/temporary drawers, auto-hide behavior, and dual-drawer layouts

### ♻️ Refactoring

- Updated `PageLoader` to use `PageContainer` and `Paper` components for a more structured loading skeleton
- Adjusted `ShowcaseAppBar` to inherit height from parent layout and simplified divider styling
- Removed `topGap` from `ShowcaseLayout` for consistent spacing
- Changed the default Layout category route from `/layout/divider` to `/layout/layout-showcase`

### 🧪 Tests

- Updated e2e navigation tests to include the new Layout Showcase page
- Updated e2e snapshots to reflect layout and styling changes

## [8.2.7] - 2026-03-06

### 🐛 Bug Fixes

- Fixed duplicated content on re-render in dropdown and menu demo pages by converting static JSX-containing arrays to factory functions that create fresh elements per render call
- Added missing `findOptions[Symbol.dispose]()` call in `GridPageService` to prevent memory leaks

### ♻️ Refactoring

- Replaced manual `useDisposable(ObservableValue)` + `useObservable` pattern with `useState()` in `MarkdownPage`, reducing boilerplate for local component state

### 📦 Build

- Added missing TypeScript project references for `@furystack/i18n`, `@furystack/shades-i18n`, and `@furystack/shades-mfe`

## [8.2.6] - 2026-03-05

### ✨ Features

- Added "View Transitions" showcase page under Navigation, demonstrating the View Transition API integration with usage examples, CSS customization, component-level support, and browser compatibility info
- Enabled `viewTransition` on the app's root `NestedRouter` so all page navigations are animated with a cross-fade transition
- Enabled `viewTransition` on all `LazyLoad` instances across routes so loader-to-content swaps are animated
- Added document-level CSS for view transition animation timing (`200ms ease-in-out`) and `prefers-reduced-motion` media query support

### 🔧 Chores

- Fixed Playwright config to use `contextOptions.reducedMotion` instead of the deprecated top-level `reducedMotion` property

## [8.2.5] - 2026-03-04

### ✨ Features

- Added `meta` objects with `title` and `icon` to all route definitions, enabling automatic breadcrumbs, document title, and sidebar navigation from route metadata
- Added `DocumentTitleUpdater` component that reactively updates `document.title` from the current route match chain (e.g. "FuryStack Shades / Data Display / Icons")
- Added `route-meta-augmentation.ts` to extend `NestedRouteMeta` with an `icon` field via declaration merging

### ♻️ Refactoring

- Refactored `ShowcaseAppBar` to derive top-level nav links from `extractNavTree()` instead of a manually maintained navigation config
- Refactored `ShowcaseBreadcrumbComponent` to resolve breadcrumb items from `RouteMatchService` and `resolveRouteTitles()`, removing hardcoded path-to-label mappings
- Refactored `SidebarNavigation` to build the sidebar tree from `extractNavTree()`, keeping navigation in sync with route definitions automatically

### ⬆️ Dependencies

- Updated `@furystack/shades` with ghost rendering race condition fix

## [8.2.4] - 2026-03-03

### ⬆️ Dependencies

- Updated multiple `@furystack/*` dependencies with EventHub error handling improvements
- Updated `@furystack/rest` and `@furystack/rest-service` with improved error handling for malformed requests

## [8.2.3] - 2026-02-28

### ✨ Features

- Rewrote `ThemeSwitch` with a `Dropdown` and `Avatar` trigger, supporting 19 lazy-loaded themes organized in groups
- Added info notification with themed quote when selecting a special theme

### 🧪 Tests

- Added Playwright e2e test for `AppBar` theme dropdown open/close and selection flow

### 🔧 Chores

- Version bump for `@furystack/shades-common-components` dependency update

## [8.2.2] - 2026-02-28

### ✨ Features

- Added a "With custom content props" demo section to the CacheView showcase page, demonstrating type-safe `contentProps` forwarding

## [8.2.1] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [8.2.0] - 2026-02-26

### ✨ Features

### Runtime Theme Switcher

Added a `useTheme()` function exposed on the `window` object for switching between all 19 available themes at runtime. Supports `dark`, `light`, `paladin`, `chieftain`, `neon-runner`, `vault-dweller`, `shadow-broker`, `dragonborn`, `plumber`, `auditore`, `replicant`, `sandworm`, `architect`, `wild-hunt`, `black-mesa`, `jedi`, `sith`, `xenomorph`, and `hawkins` themes via lazy-loaded dynamic imports.

### Monaco Editor Theme Integration

The Monaco editor now derives its color scheme from the active Shades theme instead of falling back to the generic `vs-dark` / `vs` built-in themes.

A new `createMonacoTheme()` utility maps Shades design tokens (background, text, palette, divider, action colors) to Monaco editor chrome colors — including editor background/foreground, line numbers, cursor, selection highlights, find-match markers, widgets, error/warning squiggles, bracket matching, and scrollbar styling.

The theme also updates dynamically when the user switches themes at runtime.

### ♻️ Refactoring

- Updated showcase pages to use `Typography` components instead of raw HTML heading/paragraph tags
- Updated layout test pages, input demos, and surface demos to align with the new theme-aware component APIs

### 🧪 Tests

- Updated typography and markdown E2E tests for compatibility with semantic HTML tag rendering

## [8.1.2] - 2026-02-23

### ⬆️ Dependencies

- Updated `@furystack/shades-common-components` to pick up MarkdownEditor form integration features

## [8.1.1] - 2026-02-22

### ♻️ Refactoring

- Updated the Wizard showcase to demonstrate the new `showProgress` and `stepLabels` props

### ⬆️ Dependencies

- Updated `@furystack/shades-common-components` dependency

## [8.1.0] - 2026-02-22

### ✨ Features

- Replaced the generic `TestClass` grid demo with a thematic `GameItem` model featuring RPG-style items with typed properties (name, type, rarity, level, weight, quest item flag, and discovery date)
- Added typed filter configurations for grid columns: string filter on `name`, enum filters on `type` and `rarity`, number filter on `level`, boolean filter on `isQuestItem`, and date filter on `discoveredAt`
- Added color-coded rarity display in the grid (common through legendary)

## [8.0.6] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` and `@furystack/shades-common-components` to pick up async form submission and dependency tracking in `useDisposable`

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

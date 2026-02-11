# Changelog

## [12.0.1] - 2026-02-11

### 🧪 Tests

- Wrapped all disposable resources in `using()` / `usingAsync()` across command palette, context menu, data grid, click-away service, list service, and tree service tests to ensure cleanup runs even when assertions fail

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/shades` dependency
- Removed `semaphore-async-await` dependency
- Updated `@furystack/shades` with fix for `useState` setter disposal error

## [12.0.0] - 2026-02-09

### 💥 Breaking Changes

### `Theme` interface extended with 6 new required properties

The `Theme` interface now requires the following additional properties: `action`, `shape`, `shadows`, `typography`, `transitions`, and `spacing`. Any custom theme objects must be updated to include these new token groups. See `defaultDarkTheme` and `defaultLightTheme` for reference implementations.

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback. All components have been migrated to use `useDisposable()` inside `render` for one-time setup and cleanup.

### Migrated All Components from `element` to `useHostProps` and `useRef`

All components in this package have been updated to use the new declarative `useHostProps` and `useRef` APIs from `@furystack/shades`, replacing direct imperative DOM manipulation via the removed `element` parameter.

**Impact:** Components no longer accept or use the `element` render option. Any custom components that extended or wrapped these components and relied on `element` access patterns need to be updated.

**Migration:** The component API and behavior remain the same from a consumer perspective — this is a breaking change only due to the peer dependency bump on `@furystack/shades`.

- `AppBarLink` props changed from `RouteLinkProps` to `NestedRouteLinkProps` — `href` is now required and the rendered shadow DOM element changed from `route-link` to `nested-route-link`

### ✨ Features

### Component Pack 1 — 15 new UI components

Added a full set of general-purpose UI components, all themed via CSS variable tokens, with ARIA attributes, keyboard navigation, and `FormService` integration where applicable:

**Data Display:**

- `Accordion` / `AccordionItem` — Collapsible content sections with animated expand/collapse, keyboard support, and `outlined` / `elevation` variants
- `Badge` — Count or status-dot overlay with configurable `max`, palette colors, and show/hide animation
- `Chip` — Compact tag/label element with `filled` / `outlined` variants, optional delete button, and size options
- `Tooltip` — Contextual hover/focus popup with four placement options, configurable delay, and arrow indicator

**Feedback:**

- `Alert` — Severity-coded message banner (`error` / `warning` / `info` / `success`) with `filled`, `outlined`, and `standard` variants and an optional close button
- `CircularProgress` — SVG-based circular indicator with `determinate` and `indeterminate` variants, customisable size and thickness
- `LinearProgress` — Horizontal progress bar with `determinate` and `indeterminate` variants and size options

**Surfaces:**

- `Card` — Content surface with `CardHeader`, `CardContent`, `CardMedia`, and `CardActions` sub-components, elevation levels 0–3, and an outlined variant
- `Dialog` — Modal dialog with title, body, and action slots, backdrop overlay, show/hide animation, and a `ConfirmDialog` helper function

**Layout:**

- `Divider` — Visual separator with horizontal/vertical orientation, `full` / `inset` / `middle` variants, and optional inline text content
- `Pagination` — Page navigator with ellipsis, configurable sibling/boundary counts, prev/next buttons, and size/color variants

**Inputs:**

- `Checkbox` — Checkbox with label, indeterminate state, palette colors, and `FormService` integration
- `Radio` / `RadioGroup` — Radio buttons with a group container supporting controlled and uncontrolled modes, orientation options, and shared palette color
- `Select` — Custom dropdown with full keyboard navigation (Arrow, Enter, Escape, Home, End), validation and helper-text support, and `contained` / `outlined` variants
- `Switch` — Animated toggle switch with `small` / `medium` sizes and palette color support

### New design token groups on the `Theme` interface

Extended the theme system with six new token groups, enabling centralised control over interactive states, shape, elevation, typography, motion, and spacing:

- `action` — Interactive state colors (`hoverBackground`, `selectedBackground`, `activeBackground`, `focusRing`, `disabledOpacity`, `backdrop`, `subtleBorder`)
- `shape` — Border radius scale (`xs` through `full`) for consistent rounded corners
- `shadows` — Elevation presets (`none`, `sm`, `md`, `lg`, `xl`) for layered depth
- `typography` — Font family, size scale, weight scale, and line height scale
- `transitions` — Duration presets (`fast`, `normal`, `slow`) and easing functions (`default`, `easeOut`, `easeInOut`)
- `spacing` — Spacing scale (`xs` through `xl`) for consistent padding, margins, and gaps

All new tokens are available in `defaultDarkTheme`, `defaultLightTheme`, and `cssVariableTheme`.

### New exported types

All token group types are exported for type-safe custom themes: `ActionColors`, `BorderRadiusScale`, `Shape`, `Shadows`, `FontSizeScale`, `FontWeightScale`, `LineHeightScale`, `Typography`, `TransitionDurations`, `TransitionEasings`, `Transitions`, `Spacing`.

### `buildTransition` helper

New utility function `buildTransition(...specs)` that builds CSS transition strings from `[property, duration, easing]` tuples, reducing boilerplate when composing multi-property transitions.

### New Layout System Components

A complete layout system for building application shells with AppBar, drawers, and content areas.

#### PageLayout Component

Full viewport layout component that orchestrates AppBar and drawer positioning with automatic CSS variable management.

**Features:**

- Optional AppBar with `permanent` or `auto-hide` variants
- Left and/or right drawers with `permanent`, `collapsible`, or `temporary` variants
- Responsive drawer collapse via `collapseOnBreakpoint` prop
- Configurable gaps between AppBar/drawers and content
- Scoped `LayoutService` instance for child components

**Usage:**

```tsx
<PageLayout
  appBar={{
    variant: 'permanent',
    height: '64px',
    component: <MyAppBar />,
  }}
  drawer={{
    left: {
      variant: 'collapsible',
      width: '280px',
      component: <Sidebar />,
      collapseOnBreakpoint: 'md', // Auto-collapse below 960px
    },
  }}
  topGap="16px"
  sideGap="24px"
>
  <MainContent />
</PageLayout>
```

#### Drawer Component

Standalone drawer component for sidebars and navigation panels with three behavior variants.

**Variants:**

- `permanent`: Always visible, cannot be closed
- `collapsible`: Toggleable, pushes content when open
- `temporary`: Overlays content with backdrop, closes on backdrop click

**Usage:**

```tsx
<Drawer position="left" variant="collapsible" collapseOnBreakpoint="md">
  <nav>Navigation items...</nav>
</Drawer>
```

#### DrawerToggleButton Component

A button component to toggle drawer open/close state, integrates with `LayoutService`.

**Usage:**

```tsx
<DrawerToggleButton position="left" />
```

#### PageContainer Component

Container component for consistent page content styling with max-width, centering, and spacing.

**Usage:**

```tsx
<PageContainer maxWidth="1200px" centered padding="48px" gap="24px">
  <PageHeader icon="👥" title="Users" description="Manage user accounts" />
  <Paper>Content here...</Paper>
</PageContainer>
```

#### PageHeader Component

Styled header component with optional icon, title, and description.

**Usage:**

```tsx
<PageHeader icon="📊" title="Dashboard" description="Overview of your application metrics" />
```

#### LayoutService

Service for managing layout state with observable values and CSS custom properties.

**Features:**

- Drawer state management (`drawerState`, `toggleDrawer`, `setDrawerOpen`)
- AppBar visibility control (`appBarVisible`, `appBarVariant`)
- Gap configuration (`topGap`, `sideGap`)
- Scoped CSS variables via `LAYOUT_CSS_VARIABLES` constant

**CSS Variables:**

```typescript
import { LAYOUT_CSS_VARIABLES } from '@furystack/shades-common-components'

// Available CSS variables:
// --layout-appbar-height
// --layout-drawer-left-width
// --layout-drawer-right-width
// --layout-content-margin-left
// --layout-content-margin-right
// --layout-content-padding-top
// --layout-top-gap
// --layout-side-gap
```

### List Component

Added `List` and `ListItem` components for rendering selectable, keyboard-navigable lists with support for single and multi-selection.

- Click to focus, `ArrowUp`/`ArrowDown` to navigate, `Enter` to activate an item
- Multi-selection via `Ctrl+Click` (toggle), `Shift+Click` (range), `Space` (toggle focused), `+` (select all), `-` (deselect all)
- Type-ahead search when `searchField` is configured on `ListService`
- Supports custom `renderItem`, `renderIcon`, and `renderSecondaryActions` render props
- Click-away detection to release focus
- Smooth scroll-into-view when navigating with keyboard

Added `ListService` - a standalone state manager for list focus, selection, and keyboard navigation that can be used independently of the component.

### Tree Component

Added `Tree` and `TreeItem` components for rendering hierarchical data with expand/collapse, indented levels, and keyboard navigation.

- `ArrowRight` expands a collapsed node or moves focus to its first child; `ArrowLeft` collapses an expanded node or moves focus to the parent
- Double-click toggles expand/collapse on parent nodes, activates leaf nodes
- Inherits all selection and navigation behavior from `ListService`
- Renders expand/collapse indicators (`▸`/`▾`) with level-based indentation
- Supports custom `renderItem` and `renderIcon` render props

Added `TreeService` - extends `ListService` with tree-specific state including expand/collapse tracking, flattened visible node list, and parent lookup.

### Context Menu Component

Added `ContextMenu` and `ContextMenuItemComponent` for rendering positioned popup menus with keyboard navigation and item selection.

- Supports both right-click and programmatic trigger via `ContextMenuManager.open()`
- Items can have labels, descriptions, icons, disabled state, and separators
- `ArrowUp`/`ArrowDown` to navigate, `Enter` to select, `Escape` to close, `Home`/`End` to jump
- Clicking the backdrop or right-clicking elsewhere closes the menu
- Disabled items are skipped during keyboard navigation

Added `ContextMenuManager` - manages context menu state including open/close, item list, focus index, positioning, and keyboard navigation. Emits `onSelectItem` events via `EventHub`.

### Breadcrumb Component

Added a new `Breadcrumb` component for navigating hierarchical route structures with automatic active state detection.

**Features:**

- Dynamic route parameter support (e.g., `/users/:id`)
- Custom label rendering with `render` prop
- Configurable separators (string or JSX element)
- Active item detection based on current URL
- Optional home/root link
- Last item clickable/non-clickable configuration

**Basic Usage:**

```typescript
import { Breadcrumb } from '@furystack/shades-common-components'

<Breadcrumb
  homeItem={{ path: '/', label: 'Home' }}
  items={[
    { path: '/users', label: 'Users' },
    { path: '/users/:id', label: 'User Details', params: { id: '123' } },
  ]}
  separator=" › "
/>
```

**Type-Safe Usage:**

The `createBreadcrumb<TRoutes>()` helper provides compile-time route validation:

```typescript
import { createBreadcrumb } from '@furystack/shades-common-components'
import type { appRoutes } from './routes'

const AppBreadcrumb = createBreadcrumb<typeof appRoutes>()

// ✅ Type-safe: only valid paths accepted
<AppBreadcrumb
  items={[{ path: '/buttons', label: 'Buttons' }]}
/>

// ❌ TypeScript error: invalid path
<AppBreadcrumb items={[{ path: '/nonexistent', label: 'Error' }]} />
```

**Route Parameters:**

Route parameters are automatically inferred from the path pattern:

- `path="/buttons"` — `params` is optional
- `path="/users/:id"` — `params: { id: string }` is required

### AppBarLink Enhancements

- Added `routingOptions` prop to `AppBarLink` for customizing route matching behavior using `path-to-regexp` options
- Added `createAppBarLink<TRoutes>()` helper for type-safe app bar links constrained to specific route trees

### New Components

- Added `ButtonGroup` - groups multiple buttons with shared variant, color, orientation, and disabled state
- Added `Carousel` - content carousel with slide/fade transitions, autoplay, dot indicators, vertical mode, and keyboard navigation
- Added `Dropdown` - dropdown menu with items, groups, and dividers, configurable placement, keyboard navigation, and click-away closing
- Added `Icon` - SVG icon component with size variants (small/medium/large/custom), palette colors, and accessibility support (`ariaLabel` / `aria-hidden`)
- Added 50+ SVG icon definitions (`icons` namespace) for common UI actions, navigation, status indicators, and more
- Added `Image` - image component with loading skeleton, error fallback, preview/lightbox overlay, and load/error animations
- Added `Menu` - navigation menu with vertical, horizontal, and inline modes, expandable groups, and keyboard navigation
- Added `MenuEntry` types (`MenuItemEntry`, `MenuGroupEntry`, `MenuDividerEntry`) and `getNavigableKeys` utility for building menu structures
- Added `Rating` - star rating with configurable max, half-star precision, multiple sizes, palette colors, read-only mode, and keyboard accessibility
- Added `Result` - status feedback component for success/error/warning/info and HTTP error codes (403, 404, 500) with icon, title, and subtitle
- Added `Timeline` and `TimelineItem` - vertical timeline with color-coded dots, connector lines, and alternate/left/right positioning modes
- Added `Typography` - text component with semantic variants (h1–h6, subtitle, body, caption, overline), palette colors, ellipsis truncation, and copyable text
- Added `Slider` - range/value slider with min/max/step, marks with labels, tooltips, range mode (two thumbs), and keyboard accessibility
- Added `InputNumber` - numeric input with +/- stepper buttons, min/max/step constraints, decimal precision, form integration, and validation

### Enhanced Components

- Added `text` variant, `size` prop (small/medium/large), `danger` flag, `loading` spinner, and `startIcon`/`endIcon` support to `Button`
- Added controlled mode (`activeKey`/`onTabChange`), `line`/`card` visual styles, `vertical` orientation, closable tabs with `onClose`, and an add button with `onAdd` to `Tabs`
- Added option groups (`optionGroups`), multi-select mode with chip display, and search/filter input to `Select`

### Theme Design Tokens

- Added `ZIndex` type with stacking layers: `drawer`, `appBar`, `modal`, `tooltip`, `dropdown`
- Added `Effects` type with blur tokens: `blurSm`, `blurMd`, `blurLg`, `blurXl`
- Added `LetterSpacingScale` type with spacing values: `tight`, `dense`, `normal`, `wide`, `wider`, `widest`
- All three theme presets (`defaultDarkTheme`, `defaultLightTheme`, `cssVariableTheme`) updated with the new tokens

### Migrated `styles.tsx` to CSS Variable Theme

- `colors` and `glassBox` exports now reference `cssVariableTheme` tokens instead of hardcoded values, ensuring consistency with the active theme

### 🐛 Bug Fixes

- Fixed `defaultDarkTheme.divider` using a light-theme value (`rgba(0, 0, 0, 0.12)`) — now correctly uses `rgba(255, 255, 255, 0.12)`
- Fixed DataGrid row keyboard navigation not scrolling the focused row into view
- Fixed `Autocomplete` datalist binding to use `setTimeout` instead of `queueMicrotask`, avoiding conflicts with the new microtask-based component update batching in `@furystack/shades`. Also added proper cleanup via `clearTimeout` on dispose.

### ♻️ Refactoring

### Components migrated to declarative host manipulation

All components now use `useHostProps` to set data attributes, ARIA attributes, CSS custom properties, and styles on the host element instead of imperatively calling `element.setAttribute()`, `element.style.setProperty()`, etc. This includes:

- **Button** — color custom properties, variant/size/loading data attributes
- **Checkbox** — disabled/indeterminate data attributes, color custom property, replaced `querySelector` with `useRef` for form input registration
- **Input** — focus/validation state, label/helper text attributes
- **InputNumber** — stepper button refs, value formatting
- **Select** — open/disabled state, option list management
- **Slider** — track/thumb positioning via refs and host props
- **Switch** — checked/disabled state attributes
- **TextArea** — focus/validation state
- **Radio / RadioGroup** — checked/disabled state, group management
- **Autocomplete** — dropdown state management
- **Accordion** — expanded state toggling
- **Alert** — severity data attribute and color
- **AppBar / AppBarLink** — layout positioning
- **Avatar** — size and color attributes
- **Badge** — position and color
- **Carousel** — slide positioning and navigation via refs
- **Chip** — variant and deletable state
- **CircularProgress** — progress value and size via host props
- **CommandPalette** — open state and input focus via refs
- **ContextMenu** — position and visibility
- **DataGrid / DataGridRow** — selection state, column sizing
- **Dialog** — open state and focus management via refs
- **Divider** — orientation attribute
- **Dropdown** — open/closed state
- **Fab** — position and color
- **Form** — validation state
- **Icon** — size attribute and SVG rendering
- **Image** — loading/error state
- **LinearProgress** — progress value host props
- **List / ListItem** — selection state
- **Loader** — active state
- **Menu** — open state and positioning
- **Modal** — visibility and backdrop
- **NotyList** — notification state
- **PageContainer / PageLayout** — layout dimensions
- **Pagination** — page state
- **Rating** — value and hover state via refs
- **Skeleton** — animation variant
- **Suggest** — dropdown state and input refs
- **Tabs** — active tab indicator
- **Timeline** — item positioning
- **Tooltip** — visibility and positioning
- **Tree / TreeItem** — expanded/selected state
- **Typography** — variant data attribute

### Services updated

- **ClickAwayService** — updated for compatibility with new rendering model
- **LayoutService** — updated for compatibility with new rendering model

- Replaced hardcoded `rgba(128,128,128,...)` backgrounds across all interactive components with `action.*` theme tokens
- Replaced hardcoded `border-radius` pixel values with `shape.borderRadius.*` tokens
- Replaced hardcoded `box-shadow` definitions with `shadows.*` elevation tokens
- Replaced hardcoded `font-size` and `font-weight` values with `typography.*` tokens
- Replaced hardcoded transition timing strings with `transitions.*` tokens
- Replaced hardcoded spacing pixel values with `spacing.*` tokens
- Replaced hardcoded disabled opacity, focus ring, and backdrop overlay values with `action.*` tokens
- Refactored `Button` to use `buildTransition()` helper and `spacing.lg` token instead of hardcoded values
- Migrated `Dropdown` keyboard event handler from `constructed` to `useDisposable()` in `render`
- Migrated `Checkbox`, `Input`, `InputNumber`, `Select`, `Switch`, `Slider`, `Autocomplete`, `Radio`, and `RadioGroup` form service registration from `constructed` to `useDisposable()` in `render`
- Migrated `NotyComponent` enter animation from `constructed` to `useDisposable()` in `render`
- Migrated `ButtonGroup`, `AppBar`, `CircularProgress`, `ContextMenu`, `ContextMenuItem`, `DataGrid`, `LinearProgress`, `List`, and `Tree` initialization logic from `constructed` to `useDisposable()` in `render`
- Migrated `AppBarLink` from the deprecated `RouteLink` to `NestedRouteLink` for SPA navigation
- Renamed `Typography` type to `ThemeTypography` in `ThemeProviderService` to avoid naming conflict with the new `Typography` component
- Made `zIndex`, `effects`, and `typography.letterSpacing` optional on the `Theme` interface for backward compatibility with existing custom themes

### 🧪 Tests

- Added unit tests for all 15 new components (`accordion`, `alert`, `badge`, `card`, `chip`, `circular-progress`, `dialog`, `divider`, `linear-progress`, `pagination`, `tooltip`, `checkbox`, `radio`, `radio-group`, `select`, `switch`)
- Updated `fab.spec.tsx` and `loader.spec.tsx` to assert against theme tokens instead of hardcoded values
- Fixed `styles.spec.ts` to match updated `rgba` formatting in `glassBox` border
- Added unit tests for `Drawer`, `DrawerToggleButton`, `PageLayout`, `PageContainer`, `PageHeader`, and `LayoutService`
- Updated component tests to align with the removal of `constructed` callback
- Added tests for `ListService` covering selection, focus, keyboard navigation, type-ahead search, click handling, and disposal
- Added tests for `List` and `ListItem` components verifying rendering, keyboard interactions, click behaviors, and selection callbacks
- Added tests for `TreeService` covering expand/collapse, flattened node generation, keyboard navigation (`ArrowRight`/`ArrowLeft`), parent lookup, and disposal
- Added tests for `Tree` and `TreeItem` components verifying hierarchical rendering, expand/collapse interactions, and activation callbacks
- Added tests for `ContextMenuManager` covering open/close, item selection, keyboard navigation, disabled item skipping, and disposal
- Added tests for `ContextMenu` and `ContextMenuItemComponent` verifying rendering, focus highlighting, click handling, and backdrop dismiss
- Updated tests across multiple components (accordion, alert, badge, breadcrumb, card, chip, divider, icon, autocomplete, pagination, result, suggest-input, suggestion-list, timeline, tooltip) to work with microtask-based rendering
- Refactored tests across all components (AppBar, Button, CommandPalette, DataGrid, Drawer, Fab, Form, Grid, Input, TextArea, Loader, NotyList, PageLayout, Paper, Skeleton, Suggest, Wizard) to use `usingAsync` for proper `Injector` disposal
- Updated tests across components to accommodate the new rendering flow and `flushUpdates()` for async assertions
- Updated visual snapshot baselines for form fieldset tests
- Added full test coverage for `Breadcrumb` component including runtime behavior tests and type safety validation
- Added unit tests for all new components: `ButtonGroup`, `Carousel`, `Dropdown`, `Icon`, `Image`, `Menu`, `MenuTypes`, `Rating`, `Result`, `Timeline`, `Typography`, `Slider`, and `InputNumber`
- Extended unit tests for enhanced `Button`, `Tabs`, and `Select` components

### ⬆️ Dependencies

- Peer dependency on `@furystack/shades` bumped to new major version

## [11.0.0] - 2026-02-01

### 💥 Breaking Changes

### Added Contrast Colors to ColorVariants

The `ColorVariants` type now requires contrast color properties for accessible text on colored backgrounds. This affects any code that defines custom themes or palette colors.

**New required properties:**

- `lightContrast` - Text color for the `light` variant background
- `mainContrast` - Text color for the `main` variant background
- `darkContrast` - Text color for the `dark` variant background

**Migration:**

```typescript
// Before
const myPalette: Palette = {
  primary: {
    light: '#6573c3',
    main: '#3f51b5',
    dark: '#2c387e',
  },
  // ...
}

// After
const myPalette: Palette = {
  primary: {
    light: '#6573c3',
    lightContrast: '#ffffff',
    main: '#3f51b5',
    mainContrast: '#ffffff',
    dark: '#2c387e',
    darkContrast: '#ffffff',
  },
  // ...
}
```

### ♻️ Refactoring

### Migrated Components to CSS Property

Refactored all components to use the new `css` property from `@furystack/shades` instead of inline styles and `useState` for CSS states. This provides cleaner code, better separation of concerns, and improved performance.

**Refactored components:**

- `Button` - uses `css` for hover/active/disabled states and variant styles via data attributes
- `AppBar` and `AppBarLink` - moved layout and hover styles to `css`
- `Avatar` - moved styling to `css` with support for customizable border radius
- `CommandPalette`, `CommandPaletteInput`, `CommandPaletteSuggestionList` - consolidated styles into `css`
- `DataGrid`, `DataGridRow`, `DataGridHeader`, `DataGridFooter`, `SelectionCell` - migrated grid styling to `css`
- `FAB` (Floating Action Button) - moved positioning and hover effects to `css`
- `Grid` - moved responsive grid styling to `css`
- `Input` and `TextArea` - migrated input styling and focus states to `css`
- `Loader` - minor style cleanup
- `Modal` - moved backdrop and content container styles to `css`
- `NotyList` - migrated notification styling to `css`
- `Paper` - moved card styling to `css`
- `Skeleton` - minor style cleanup
- `Suggest`, `SuggestInput`, `SuggestionList` - consolidated autocomplete styling into `css`
- `Tabs` - moved tab styling and active states to `css`
- `Wizard` - moved wizard container styles to `css`

## [10.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Added detailed README with component documentation and usage examples

### 🔧 Chores

- Migrated to centralized changelog management system

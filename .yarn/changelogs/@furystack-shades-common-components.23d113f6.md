<!-- version-type: minor -->

# @furystack/shades-common-components

## ✨ Features

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

## 🐛 Bug Fixes

- Fixed DataGrid row keyboard navigation not scrolling the focused row into view

## 🧪 Tests

- Added unit tests for `Drawer`, `DrawerToggleButton`, `PageLayout`, `PageContainer`, `PageHeader`, and `LayoutService`

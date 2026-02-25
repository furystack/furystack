# @furystack/shades-common-components

Common and reusable UI components for FuryStack Shades.

## Installation

```bash
npm install @furystack/shades-common-components
# or
yarn add @furystack/shades-common-components
```

## Components

### Button

A styled button component with contained and outlined variants.

```tsx
import { Button } from '@furystack/shades-common-components'

// Contained button (default)
<Button onclick={() => console.log('Clicked!')}>Click me</Button>

// Outlined button
<Button variant="outlined" color="primary">Outlined</Button>

// Disabled button
<Button disabled>Disabled</Button>

// With color
<Button variant="contained" color="error">Delete</Button>
```

### Input

A styled text input with validation support.

```tsx
import { Input } from '@furystack/shades-common-components'

// Basic input
<Input
  labelTitle="Username"
  placeholder="Enter your username"
  onTextChange={(value) => console.log(value)}
/>

// With validation
<Input
  labelTitle="Email"
  type="email"
  required
  variant="outlined"
  getValidationResult={({ state }) => {
    if (!state.value.includes('@')) {
      return { isValid: false, message: 'Please enter a valid email' }
    }
    return { isValid: true }
  }}
/>

// Contained variant
<Input
  labelTitle="Password"
  type="password"
  variant="contained"
  defaultColor="primary"
/>
```

### Modal

A modal dialog component.

```tsx
import { Modal } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

const isVisible = new ObservableValue(false)

<Button onclick={() => isVisible.setValue(true)}>Open Modal</Button>

<Modal
  isVisible={isVisible}
  onClose={() => isVisible.setValue(false)}
  backdropStyle={{ background: 'rgba(0, 0, 0, 0.5)' }}
>
  <div onclick={(e) => e.stopPropagation()}>
    <h2>Modal Title</h2>
    <p>Modal content goes here</p>
    <Button onclick={() => isVisible.setValue(false)}>Close</Button>
  </div>
</Modal>
```

### DataGrid

A data grid component for displaying tabular data.

```tsx
import { DataGrid, CollectionService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

type User = { id: number; name: string; email: string }

const collectionService = new CollectionService<User>({ /* options */ })
const findOptions = new ObservableValue({ top: 10, skip: 0 })

<DataGrid<User, 'name' | 'email'>
  columns={['name', 'email']}
  collectionService={collectionService}
  findOptions={findOptions}
  headerComponents={{
    name: () => <span>Name</span>,
    email: () => <span>Email</span>,
  }}
  rowComponents={{
    name: (user) => <span>{user.name}</span>,
    email: (user) => <span>{user.email}</span>,
  }}
  styles={{ container: { minHeight: '400px' } }}
/>
```

### AppBar

A top navigation bar component.

```tsx
import { AppBar, AppBarLink } from '@furystack/shades-common-components'
;<AppBar>
  <h1>My App</h1>
  <AppBarLink href="/">Home</AppBarLink>
  <AppBarLink href="/about">About</AppBarLink>
</AppBar>
```

### Tabs

A tabbed interface component.

```tsx
import { Tabs } from '@furystack/shades-common-components'
;<Tabs
  tabs={[
    { header: <span>Tab 1</span>, component: <div>Content 1</div> },
    { header: <span>Tab 2</span>, component: <div>Content 2</div> },
  ]}
/>
```

### CacheView

Renders the state of a cache entry. Takes a `Cache` instance and `args`, subscribes to the observable, and handles loading, error (with retry), and loaded/obsolete states.

```tsx
import { CacheView } from '@furystack/shades-common-components'
import type { CacheWithValue } from '@furystack/cache'

const UserContent = Shade<{ data: CacheWithValue<User> }>({
  shadowDomName: 'user-content',
  render: ({ props }) => <div>{props.data.value.name}</div>,
})

// Basic usage
<CacheView cache={userCache} args={[userId]} content={UserContent} />

// With custom loader and error
<CacheView
  cache={userCache}
  args={[userId]}
  content={UserContent}
  loader={<Skeleton />}
  error={(err, retry) => <Alert severity="error"><Button onclick={retry}>Retry</Button></Alert>}
/>
```

### Loader

A loading spinner component.

```tsx
import { Loader } from '@furystack/shades-common-components'
;<Loader />
```

### Paper

A container component with elevation.

```tsx
import { Paper } from '@furystack/shades-common-components'
;<Paper>
  <p>Content with elevated background</p>
</Paper>
```

### Avatar

An avatar component for displaying user images or initials.

```tsx
import { Avatar } from '@furystack/shades-common-components'
;<Avatar userName="John Doe" />
```

### FAB (Floating Action Button)

A floating action button component.

```tsx
import { Fab } from '@furystack/shades-common-components'
;<Fab onclick={() => console.log('FAB clicked')}>+</Fab>
```

### Typography

A text component that renders semantic HTML elements (`h1`–`h6`, `p`, `span`) based on the `variant` prop.

```tsx
import { Typography } from '@furystack/shades-common-components'

// Heading
<Typography variant="h1">Page Title</Typography>

// Body text (default variant is 'body1')
<Typography>Regular paragraph text</Typography>

// With color
<Typography variant="h3" color="primary">Primary Heading</Typography>
<Typography color="textSecondary">Secondary text</Typography>

// Truncated with ellipsis (single line)
<Typography ellipsis>This text will be truncated if it overflows...</Typography>

// Multi-line clamp
<Typography ellipsis={3}>This text will be clamped to 3 lines...</Typography>

// Copyable
<Typography copyable>Click the icon to copy this text</Typography>

// Alignment and gutter
<Typography align="center" gutterBottom>Centered with bottom margin</Typography>
```

**Variants:** `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `caption`, `overline`

**Colors:** Any palette key (`primary`, `secondary`, `error`, `warning`, `success`, `info`) or `textPrimary`, `textSecondary`, `textDisabled`

## Theming

The component library includes a CSS-variable-based theming system with runtime theme switching.

### Available Themes

Two default themes are included in the main entry point:

| Theme         | Export              | Description                   |
| ------------- | ------------------- | ----------------------------- |
| Default Light | `defaultLightTheme` | Light theme with system fonts |
| Default Dark  | `defaultDarkTheme`  | Dark theme with system fonts  |

12 additional pop-culture-inspired themes are available as deep imports for tree-shaking:

| Theme         | Import Path                                                | Inspiration              |
| ------------- | ---------------------------------------------------------- | ------------------------ |
| Architect     | `@furystack/shades-common-components/themes/architect`     | The Matrix               |
| Auditore      | `@furystack/shades-common-components/themes/auditore`      | Assassin's Creed         |
| Chieftain     | `@furystack/shades-common-components/themes/chieftain`     | Warcraft 1 Orc faction   |
| Dragonborn    | `@furystack/shades-common-components/themes/dragonborn`    | Skyrim                   |
| Neon Runner   | `@furystack/shades-common-components/themes/neon-runner`   | Cyberpunk                |
| Paladin       | `@furystack/shades-common-components/themes/paladin`       | Warcraft 1 Human faction |
| Plumber       | `@furystack/shades-common-components/themes/plumber`       | Super Mario              |
| Replicant     | `@furystack/shades-common-components/themes/replicant`     | Blade Runner             |
| Sandworm      | `@furystack/shades-common-components/themes/sandworm`      | Dune                     |
| Shadow Broker | `@furystack/shades-common-components/themes/shadow-broker` | Mass Effect              |
| Vault Dweller | `@furystack/shades-common-components/themes/vault-dweller` | Fallout                  |
| Wild Hunt     | `@furystack/shades-common-components/themes/wild-hunt`     | The Witcher 3            |

### Applying a Theme

Use `useThemeCssVariables` to set CSS variables on `:root`:

```tsx
import { useThemeCssVariables, defaultLightTheme } from '@furystack/shades-common-components'

// Apply on startup
useThemeCssVariables(defaultLightTheme)
```

For reactive theme switching through the injector, use `ThemeProviderService`:

```tsx
import { ThemeProviderService, defaultDarkTheme } from '@furystack/shades-common-components'

const themeProvider = injector.getInstance(ThemeProviderService)
themeProvider.setAssignedTheme(defaultDarkTheme)

// Listen for changes
themeProvider.subscribe('themeChanged', (theme) => {
  console.log('Theme changed:', theme.name)
})
```

Deep-imported themes can be loaded lazily:

```tsx
const { architectTheme } = await import('@furystack/shades-common-components/themes/architect')
themeProvider.setAssignedTheme(architectTheme)
```

### Theme Structure

A `Theme` object contains design tokens for the entire UI:

- **`palette`** — Semantic colors (`primary`, `secondary`, `error`, `warning`, `success`, `info`) each with `light`/`main`/`dark` variants and contrast colors
- **`text`** — Text colors at `primary`, `secondary`, and `disabled` emphasis levels
- **`background`** — Surface colors (`default`, `paper`) and an optional `paperImage`
- **`button`** — Button state colors (active, hover, selected, disabled)
- **`typography`** — Font family, size scale, weight scale, line heights, and letter spacing
- **`spacing`** — Spacing scale (`xs` through `xl`)
- **`shape`** — Border radius scale and border width
- **`shadows`** — Elevation presets (`none`, `sm`, `md`, `lg`, `xl`)
- **`transitions`** — Duration and easing presets
- **`action`** — Interactive state colors (hover, selected, focus ring, backdrop)
- **`zIndex`** — Stacking layers (drawer, appBar, modal, tooltip, dropdown)
- **`effects`** — Blur values for glassy surfaces

### CSS Variable System

All components reference tokens through `cssVariableTheme`, which resolves to CSS custom properties (e.g. `var(--shades-theme-text-primary)`). When you call `useThemeCssVariables(theme)`, the actual theme values are written to `:root`, and all components update automatically.

```tsx
import { cssVariableTheme, buildTransition } from '@furystack/shades-common-components'

// Use tokens in component styles
const style = {
  color: cssVariableTheme.text.primary,
  background: cssVariableTheme.background.paper,
  borderRadius: cssVariableTheme.shape.borderRadius.md,
  transition: buildTransition([
    'background',
    cssVariableTheme.transitions.duration.normal,
    cssVariableTheme.transitions.easing.default,
  ]),
}
```

### Creating a Custom Theme

Define a palette and a theme object satisfying the `Theme` interface:

```tsx
import type { Palette, Theme } from '@furystack/shades-common-components'

const myPalette: Palette = {
  primary: {
    light: '#6ec6ff',
    lightContrast: '#000',
    main: '#2196f3',
    mainContrast: '#fff',
    dark: '#0069c0',
    darkContrast: '#fff',
  },
  secondary: {
    light: '#ff79b0',
    lightContrast: '#000',
    main: '#ff4081',
    mainContrast: '#fff',
    dark: '#c60055',
    darkContrast: '#fff',
  },
  error: {
    light: '#ff6659',
    lightContrast: '#000',
    main: '#f44336',
    mainContrast: '#fff',
    dark: '#ba000d',
    darkContrast: '#fff',
  },
  warning: {
    light: '#ffb74d',
    lightContrast: '#000',
    main: '#ff9800',
    mainContrast: '#000',
    dark: '#f57c00',
    darkContrast: '#fff',
  },
  success: {
    light: '#81c784',
    lightContrast: '#000',
    main: '#4caf50',
    mainContrast: '#fff',
    dark: '#388e3c',
    darkContrast: '#fff',
  },
  info: {
    light: '#64b5f6',
    lightContrast: '#000',
    main: '#2196f3',
    mainContrast: '#fff',
    dark: '#1976d2',
    darkContrast: '#fff',
  },
}

const myTheme: Theme = {
  name: 'my-theme',
  palette: myPalette,
  text: { primary: '#fff', secondary: 'rgba(255,255,255,0.7)', disabled: 'rgba(255,255,255,0.5)' },
  // ... remaining tokens (see defaultLightTheme or defaultDarkTheme for a full reference)
}
```

## Services

### CollectionService

A service for managing collections of data with pagination, sorting, and filtering.

```tsx
import { CollectionService } from '@furystack/shades-common-components'

const service = new CollectionService<MyModel>({
  loader: async (options) => {
    const response = await fetch('/api/items', {
      /* ... */
    })
    return response.json()
  },
})

// Subscribe to data changes
service.data.subscribe((items) => {
  console.log('Items updated:', items)
})
```

### ThemeProviderService

A singleton service for managing the active theme. It updates CSS variables and emits a `themeChanged` event so components can react to theme switches.

```tsx
import { ThemeProviderService, defaultDarkTheme } from '@furystack/shades-common-components'

const themeProvider = injector.getInstance(ThemeProviderService)

// Access the CSS-variable-based theme reference (for use in styles)
const primaryColor = themeProvider.theme.palette.primary.main

// Switch theme at runtime
themeProvider.setAssignedTheme(defaultDarkTheme)

// Read the currently assigned theme
const current = themeProvider.getAssignedTheme()

// Listen for theme changes
themeProvider.subscribe('themeChanged', (theme) => {
  console.log('Switched to', theme.name)
})
```

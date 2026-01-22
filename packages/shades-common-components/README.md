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

<AppBar>
  <h1>My App</h1>
  <AppBarLink href="/">Home</AppBarLink>
  <AppBarLink href="/about">About</AppBarLink>
</AppBar>
```

### Tabs

A tabbed interface component.

```tsx
import { Tabs } from '@furystack/shades-common-components'

<Tabs
  tabs={[
    { header: <span>Tab 1</span>, component: <div>Content 1</div> },
    { header: <span>Tab 2</span>, component: <div>Content 2</div> },
  ]}
/>
```

### Loader

A loading spinner component.

```tsx
import { Loader } from '@furystack/shades-common-components'

<Loader />
```

### Paper

A container component with elevation.

```tsx
import { Paper } from '@furystack/shades-common-components'

<Paper>
  <p>Content with elevated background</p>
</Paper>
```

### Avatar

An avatar component for displaying user images or initials.

```tsx
import { Avatar } from '@furystack/shades-common-components'

<Avatar userName="John Doe" />
```

### FAB (Floating Action Button)

A floating action button component.

```tsx
import { Fab } from '@furystack/shades-common-components'

<Fab onclick={() => console.log('FAB clicked')}>+</Fab>
```

## Services

### CollectionService

A service for managing collections of data with pagination, sorting, and filtering.

```tsx
import { CollectionService } from '@furystack/shades-common-components'

const service = new CollectionService<MyModel>({
  loader: async (options) => {
    const response = await fetch('/api/items', { /* ... */ })
    return response.json()
  },
})

// Subscribe to data changes
service.data.subscribe((items) => {
  console.log('Items updated:', items)
})
```

### ThemeProviderService

Provides theming capabilities for all components.

```tsx
import { ThemeProviderService } from '@furystack/shades-common-components'

// Get the theme provider instance from the injector
const themeProvider = injector.getInstance(ThemeProviderService)

// Access theme properties
const primaryColor = themeProvider.theme.palette.primary.main
```

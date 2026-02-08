# @furystack/shades-mfe

Micro-frontend support for FuryStack Shades. This package allows you to dynamically load and render independent micro-frontend modules within your Shades application.

## Installation

```bash
npm install @furystack/shades-mfe
# or
yarn add @furystack/shades-mfe
```

## Usage

### Creating a Shades Micro-Frontend

Use `createShadesMicroFrontend` to wrap a Shades component as a micro-frontend module:

```tsx
// In your MFE module (e.g., remote-app/index.tsx)
import { Shade } from '@furystack/shades'
import { createShadesMicroFrontend } from '@furystack/shades-mfe'

type MyMfeApi = {
  greeting: string
  onAction: () => void
}

const MyMfeComponent = Shade<MyMfeApi>({
  tagName: 'my-mfe-component',
  render: ({ props }) => (
    <div>
      <h1>{props.greeting}</h1>
      <button onclick={props.onAction}>Click me</button>
    </div>
  ),
})

export default createShadesMicroFrontend(MyMfeComponent)
```

### Loading a Micro-Frontend in the Host App

Use the `MicroFrontend` component to load and render your micro-frontend:

```tsx
import { Shade } from '@furystack/shades'
import { MicroFrontend } from '@furystack/shades-mfe'

type MyMfeApi = {
  greeting: string
  onAction: () => void
}

const HostApp = Shade({
  tagName: 'host-app',
  render: () => (
    <MicroFrontend<MyMfeApi>
      api={{
        greeting: 'Hello from host!',
        onAction: () => console.log('Action triggered'),
      }}
      loaderCallback={() => import('http://localhost:3001/my-mfe.js')}
      loader={<div>Loading...</div>}
      error={(error, retry) => (
        <div>
          <p>Failed to load: {String(error)}</p>
          <button onclick={retry}>Retry</button>
        </div>
      )}
    />
  ),
})
```

### Creating a Custom Micro-Frontend

For non-Shades micro-frontends or more control over the lifecycle:

```tsx
import { createCustomMicroFrontend } from '@furystack/shades-mfe'

type MyApi = {
  data: string
}

export default createCustomMicroFrontend<MyApi>({
  onCreate: ({ api, rootElement, injector }) => {
    // Initialize your custom component
    rootElement.innerHTML = `<div>${api.data}</div>`
  },
  onDestroy: ({ api, injector }) => {
    // Cleanup when the MFE is unmounted
  },
})
```

## API Reference

### `MicroFrontend<TApi>`

Component for loading and displaying micro-frontends.

**Props:**

| Prop             | Type                                                                     | Description                                 |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `api`            | `TApi`                                                                   | The API object passed to the micro-frontend |
| `loaderCallback` | `() => Promise<CreateMicroFrontendService<TApi>>`                        | Async function to load the MFE module       |
| `loader`         | `JSX.Element` (optional)                                                 | Element to display while loading            |
| `error`          | `(error: unknown, retry: () => Promise<void>) => JSX.Element` (optional) | Error handler with retry capability         |

### `createShadesMicroFrontend<TApi>(Component)`

Creates a micro-frontend service from a Shades component.

### `createCustomMicroFrontend<TApi>(options)`

Creates a micro-frontend service with custom create/destroy callbacks.

**Options:**

| Option      | Type                                  | Description                      |
| ----------- | ------------------------------------- | -------------------------------- |
| `onCreate`  | `CreateMfeCallback<TApi>`             | Called when the MFE is mounted   |
| `onDestroy` | `DestroyMfeCallback<TApi>` (optional) | Called when the MFE is unmounted |

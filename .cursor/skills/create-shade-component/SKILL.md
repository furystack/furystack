---
name: create-shade-component
description: Create a Shade component from scratch. Use when the user asks to create/add a component, page, widget, dialog, form, or any UI primitive built with @furystack/shades.
---

# create-shade-component

Generate a Shade component that follows `.cursor/rules/CODE_STYLE.mdc`, `.cursor/rules/TYPESCRIPT_GUIDELINES.mdc`, `.cursor/rules/COMPLEXITY.mdc`, and (where present) `.cursor/rules/SHADES_COMPONENTS.mdc` / `.cursor/rules/LIBRARY_DEVELOPMENT.mdc`. Read those rules first; this skill owns the workflow.

## Step 1 — Clarify scope

Ask the user (or infer):

- **Role**: page (route target), composite (orchestrator), or presentational (leaf)?
- **Location**: `frontend/src/pages/<x>.tsx` for pages, `frontend/src/components/<x>/index.tsx` for components with assets, `frontend/src/components/<x>.tsx` otherwise. For framework code: `packages/shades-common-components/src/<x>.tsx`.
- **`customElementName`**: kebab-case, unique, namespaced (e.g. `shade-login`, `app-bar`, `chat-message-list`). Verify uniqueness with a quick grep before creation.

## Step 2 — Type the props

```typescript
type MyComponentProps = {
  // required first, optional after, callbacks last
  id: string
  variant?: 'compact' | 'full'
  onSelect?: (id: string) => void
}
```

- `Props` suffix, PascalCase
- `type`, not `interface`
- ≤6 fields excluding `children` and `className` (COMPLEXITY threshold). Group into objects or split the component if you cross it.

## Step 3 — Choose render hooks

Pull only the hooks you actually use from the destructured `render` arg.

| Need                                          | Hook                                                    |
| --------------------------------------------- | ------------------------------------------------------- |
| Local state                                   | `useState('key', initial)` — preferred for simple cases |
| Subscribe to a service `ObservableValue`      | `useObservable('key', observable)`                      |
| Own a long-lived disposable in this component | `useDisposable('key', () => factoryFn())`               |
| Direct DOM access (focus, scroll, animation)  | `useRef<HTMLElement>('key')`                            |
| Set host element attributes / styles          | `useHostProps({ ... })`                                 |
| Get a service                                 | `injector.get(ServiceToken)`                            |

Forbidden / removed:

- `element` in render args — use `useHostProps` / `useRef`
- `onAttach` / `onDetach` in `ShadeOptions` — use `useDisposable`
- Manual `.subscribe()` in render — use `useObservable`
- `.getValue()` in render without `useObservable` — re-renders won't trigger
- `useState` for hover / focus / active — use `&:hover` etc. in `css`

## Step 4 — Choose styling approach

| Use case                                                           | Where                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Defaults, pseudo-selectors (`&:hover`, `&:disabled`), nested rules | `css: { ... }` on `Shade(...)`                                  |
| Per-instance dynamic values from props                             | `style={{ ... }}` on JSX, or `useHostProps({ style: { ... } })` |
| Theme color / spacing                                              | `cssVariableTheme.text.primary` etc. (typed)                    |
| CSS custom properties for child consumption                        | `useHostProps({ style: { '--my-var': value } })`                |

Static styles → `css` (not `useHostProps({ style })`). Attribute-driven styles → CSS rule on the data attribute, not a JS branch.

## Step 5 — Compose

```typescript
import { Shade } from '@furystack/shades'

type GreetingProps = {
  name: string
  onGreet?: () => void
}

export const Greeting = Shade<GreetingProps>({
  customElementName: 'app-greeting',
  css: {
    padding: '8px 16px',
    '&:hover': { backgroundColor: cssVariableTheme.background.paper },
  },
  render: ({ props, useState }) => {
    const [count, setCount] = useState('count', 0)
    const handleClick = () => {
      setCount(count + 1)
      props.onGreet?.()
    }
    return (
      <button onclick={handleClick}>
        Hello {props.name} ({count})
      </button>
    )
  },
})
```

## Step 6 — Apply COMPLEXITY guard

Before finishing, count triggers from `.cursor/rules/COMPLEXITY.mdc`:

- > 3 `useObservable` / `useDisposable` calls?
- > 4 distinct `injector.get(...)` calls?
- JSX return >60 lines?
- Render handler bodies >15 lines each?
- File length nearing 200 lines?

If 2+ triggers approach their limit, **stop and decompose** before merging more logic in:

- Extract pure helpers into a sibling file
- Pull a slice into a render-hook helper (`use-<feature>.ts`)
- Split into sub-Shades and pass focused props

## Step 7 — Wire up

If this is a route target, register it in the router (per repo: `frontend/src/components/body.tsx` or `routes/<module>-routes.tsx`). For new feature entry points, the user may want one or more of:

- Avatar menu item
- Command palette command provider
- App shortcut widget for the dashboard
- Default dashboard placement
- App bar entry (rarely)

Ask the user which entry points are wanted; don't create them all by default.

## Step 8 — Spec

Run the `write-tests` skill (or follow `TESTING_GUIDELINES.mdc`) to create:

- Vitest spec with `environment: 'jsdom'` for render tests
- Await `flushUpdates()` before asserting DOM after state changes
- E2E spec via Playwright if it's a user-facing flow; locate by `customElementName`

## Step 9 — Verify

```bash
yarn lint
yarn build
yarn test <path-to-spec>
```

Fix any `@furystack/eslint-plugin` violations; do not silence them with `eslint-disable` unless paired with `onDispose` (the documented exception for `prefer-using-wrapper`).

## Output

Report:

- File(s) created
- Element name + render hooks used
- Props surface
- Tests added
- Any deferred decisions (entry points the user must confirm)

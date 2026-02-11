# Cache State Handling in UI

## CacheView Component

`CacheView` is a Shades component in `@furystack/shades-common-components` that renders the state of a cache entry. It takes a `Cache` instance and `args`, subscribes to the observable, and handles all cache states automatically.

### Props

| Prop      | Type                                                 | Required | Default | Description                                                              |
| --------- | ---------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `cache`   | `Cache<TData, TArgs>`                                | Yes      |         | The cache instance to observe                                            |
| `args`    | `TArgs`                                              | Yes      |         | Arguments identifying which cache entry to display                       |
| `content` | `ShadeComponent<{ data: CacheWithValue<TData> }>`    | Yes      |         | Shades component rendered when a value is available (loaded or obsolete) |
| `loader`  | `JSX.Element`                                        | No       | `null`  | Custom loader shown when loading and no value exists                     |
| `error`   | `(error: unknown, retry: () => void) => JSX.Element` | No       | Result  | Custom error UI; receives error and retry callback                       |

### Evaluation Order

1. **Error first** -- If `isFailedCacheResult(result)`: show error UI. Do not render content, even if stale value exists.
2. **Value next** -- If `hasCacheValue(result)` (loaded or obsolete): render content. When obsolete, triggers `cache.reload(...args)` automatically.
3. **Loading last** -- If no value and no error: show loader or null.

### Usage

```tsx
import { Cache, CacheWithValue } from '@furystack/cache'
import { Shade, createComponent } from '@furystack/shades'
import { CacheView } from '@furystack/shades-common-components'

const UserContent = Shade<{ data: CacheWithValue<User> }>({
  shadowDomName: 'user-content',
  render: ({ props }) => <div>{props.data.value.name}</div>,
})

// Basic usage - cache + args, no callbacks needed
<CacheView cache={userCache} args={[userId]} content={UserContent} />

// With custom loader
<CacheView
  cache={userCache}
  args={[userId]}
  content={UserContent}
  loader={<Skeleton />}
/>

// With custom error UI (inline style)
<CacheView
  cache={userCache}
  args={[userId]}
  content={UserContent}
  error={(err, retry) => (
    <Alert severity="error" title="Failed to load user">
      <Button onclick={retry}>Retry</Button>
    </Alert>
  )}
/>
```

### Key Details

- **Retry**: Implemented internally as `cache.reload(...args)` and passed to the error UI. No callback props needed.
- **Revalidation**: When obsolete, the component calls `cache.reload(...args)` once per obsolete cycle and renders content with the stale value.
- **Args reactivity**: When `args` change, the component re-subscribes to the observable for the new cache entry.
- **Default loader**: `null` (nothing shown). Pass a `loader` prop when you want a visible loading state.
- **Content type**: `CacheWithValue<TData>` guarantees `.value` and `.updatedAt` are present. Content can check `result.status` to distinguish between `'loaded'` and `'obsolete'`.

<!-- version-type: major -->

# @furystack/core

## 💥 Breaking Changes

### IdentityContext lifetime changed from `scoped` to `explicit`

`IdentityContext` now uses `@Injectable({ lifetime: 'explicit' })` instead of `@Injectable({ lifetime: 'scoped' })`.

**Why:** With `scoped` lifetime, child injectors created via `createChild()` could not inherit the `IdentityContext` from their parent. Each child silently created a new default instance whose methods returned `false` or threw `"No IdentityContext"`. This was a common source of confusion, especially in Shades frontend applications where nested component injectors should share the same identity.

With `explicit` lifetime, `getInstance(IdentityContext)` walks up the parent injector chain, so you only need to set it once on the root (or request-scoped) injector and all descendants will find it.

**Who is affected:** Code that called `injector.getInstance(IdentityContext)` without a prior `setExplicitInstance` call. Previously this returned a useless default instance; now it throws `CannotInstantiateExplicitLifetimeError`.

**Who is NOT affected:** All standard FuryStack server-side setups (`useHttpAuthentication`, `useJwtAuthentication`, `useSystemIdentityContext`, REST/WebSocket API managers) already call `setExplicitInstance` before accessing `IdentityContext` and will continue to work without changes.

**Migration:**

```typescript
// ❌ Before (scoped) — silently returned a broken default
const ctx = injector.getInstance(IdentityContext)

// ✅ After (explicit) — set it before accessing
injector.setExplicitInstance(myIdentityContext, IdentityContext)
const ctx = injector.getInstance(IdentityContext) // works

// ✅ Child injectors now inherit automatically
const child = injector.createChild()
const ctx = child.getInstance(IdentityContext) // same instance from parent
```

## 📚 Documentation

- Updated `IdentityContext` JSDoc to reflect the `explicit` lifetime, including setup instructions and parent inheritance behavior

<!-- version-type: minor -->

# @furystack/eslint-plugin

## 🗑️ Deprecated

### Removed `furystack/no-removed-shade-apis`

The rule guarded against APIs that were dropped during the Shades render-time refactor (`element`, `onAttach`, `onDetach`). With those APIs gone for several releases and TypeScript reporting their absence directly at the call site, the rule no longer earns its keep — every violation now surfaces as a type error before the linter runs.

The rule, its tests, and its registration have been removed from the plugin and from both bundled configs (`shades` and `shadesStrict`).

**Impact:** consumers who reference `furystack/no-removed-shade-apis` directly in their own ESLint configs must drop the line. Consumers using the bundled `shades` / `shadesStrict` configs need no change.

**Migration:**

```js
// ❌ Before
{
  rules: {
    'furystack/no-removed-shade-apis': 'error',
  },
}

// ✅ After — drop the line entirely; TypeScript reports the violations
{
  rules: {
    // (removed)
  },
}
```

## ⬆️ Dependencies

- Bump `@typescript-eslint/utils` and `@typescript-eslint/rule-tester` to `^8.59.0`.
- Bump dev `vitest` to `^4.1.5`.

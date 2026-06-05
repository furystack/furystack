<!-- version-type: patch -->

# @furystack/eslint-plugin

## ✨ Features

### New rule: `no-non-deterministic-globals-in-handler`

Flags non-deterministic global access inside `defineTaskHandler` factory bodies, where replay re-runs require deterministic results. Reported globals: `Date.now`, `Math.random`, `crypto.randomUUID`, `crypto.getRandomValues`, `setTimeout`, `setInterval`, `fetch`, and `new Date()` with no arguments. Each message points at the determinism-safe `ctx.*` replacement (`ctx.now()`, `ctx.random()`, `ctx.sleep()`, `ctx.fetch()`). The walk descends into nested callbacks/helpers inside the handler, and leaves member calls like `obj.fetch` and `new Date(iso)` alone.

The rule is enabled as `'error'` in both the `recommended` and `recommendedStrict` shared configs.

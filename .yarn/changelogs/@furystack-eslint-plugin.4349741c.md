<!-- version-type: minor -->

# @furystack/eslint-plugin

## ✨ Features

### New rule `rest-no-type-cast`

Forbids unsafe type assertions (`as T`, `x!`, `<T>x`) inside typed REST API calls — `createClient<T>()` from `@furystack/rest-client-fetch` and `useRestService<T>()` from `@furystack/rest-service`. Casts are flagged when they appear in argument subtrees, on the callee (e.g. `(client as any)(...)`), or on the awaited `.result` of a REST call. `as const` and `satisfies` remain allowed.

The rule is type-aware: it classifies a callee by resolving its symbol and walking back to the factory call that produced it, so `const client = createClient<MyApi>(...)` followed by `client({...})` is correctly recognized even across files and re-exports.

Added to `recommendedStrict` as `error`.

### New rule `router-no-type-cast`

Forbids unsafe type assertions inside Shades nested router APIs: functions produced by `createNestedNavigate`, `createNestedReplace`, `createNestedHooks` (`getTypedQuery`, `getTypedHash`) and the component produced by `createNestedRouteLink`. Casts in call arguments, on the callee, or inside JSX prop expressions are reported; `as const` remains allowed.

Both rules require typed ESLint (`parserOptions.project` / `projectService`) and silently no-op when type information is not available.

Added to `shadesStrict` as `error`.

### Escape hatch

Both rules intentionally do not auto-fix. When a cast is unavoidable (e.g. integrating with an API that returns `unknown`), use `// eslint-disable-next-line furystack/rest-no-type-cast -- <reason>` or the router equivalent so the rationale stays visible in diffs.

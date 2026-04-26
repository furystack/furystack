<!-- version-type: patch -->

# @furystack/entity-sync-service

## 🐛 Bug Fixes

### Stop retaining the per-message websocket injector for the lifetime of a subscription

`SubscriptionManager.subscribeEntity` and `SubscriptionManager.subscribeCollection` previously stored the per-message injector handed in by `SyncSubscribeAction` as the long-lived `clientInjector` for the subscription. With `@furystack/websocket-api@14`, that injector is a per-message scope that gets disposed as soon as the action returns, so every subsequent collection re-evaluation called `findEntities`/`countEntities` on a disposed scope. On any DataSet that exposes `authorizeGet` (or anything else that resolves `IdentityContext`), this turned legitimate change notifications into `subscription-error` messages — visible to clients as snapshot/sidebar/dashboard lists that never refreshed after writes.

The manager now snapshots the caller's identity once at subscribe time (via `IdentityContext.getCurrentUser()`), spawns a fresh long-lived child of the root injector with that identity bound on a snapshot `IdentityContext` (`isAuthenticated`, `isAuthorized` derived from the captured `user.roles`, `getCurrentUser` returning the captured user), and uses that scope for the initial query as well as every subsequent re-evaluation. The captured scope is disposed on `unsubscribe`, on socket close, on `subscription-error` paths, and on manager dispose.

Anonymous callers (no `IdentityContext` bound, or `getCurrentUser()` rejects) fall back to the default unauthenticated `IdentityContext`, so `authorizeGet` hooks still see an unauthenticated identity instead of a system-elevated one.

## 🧪 Tests

- Added regression tests in `subscription-manager.spec.ts` covering the per-message scope disposal scenario:
  - Collection notifications keep flowing after the caller scope is disposed.
  - `authorizeGet` re-runs against the captured identity, not the disposed caller scope.
  - Unauthenticated callers receive `subscription-error` from `authorizeGet` (no identity leakage).
  - Captured `user.roles` are preserved across re-evaluations.
  - Entity-update notifications still flow when the caller scope is disposed.

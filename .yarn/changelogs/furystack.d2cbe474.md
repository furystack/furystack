<!-- version-type: patch -->

# furystack

## 🐛 Bug Fixes

- Fixed entity-sync collection re-evaluations failing with `subscription-error` after the bump to `@furystack/websocket-api@14`: `SubscriptionManager` no longer retains the disposable per-message injector. See `@furystack/entity-sync-service` changelog for details.

## 🧪 Tests

- Added regression coverage in `@furystack/entity-sync-service` for the per-message scope disposal scenario, including a test with a DataSet `authorizeGet` hook that mirrors the production failure mode.

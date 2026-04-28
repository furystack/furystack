<!-- version-type: patch -->

# @furystack/websocket-api

## 🔧 Chores

- Updated the websocket integration test that exercises mid-session role updates to invalidate the new `UserResolutionCache` after mutating the user record. Documents the recommended pattern for apps that mutate user state out-of-band: call `injector.get(UserResolutionCache).invalidate(...)` (or `invalidateAll()`) after the change so the next websocket message picks up the new identity instead of waiting for the cache TTL to elapse.

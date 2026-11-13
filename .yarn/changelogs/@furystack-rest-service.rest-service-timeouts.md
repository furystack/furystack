<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- Added configurable HTTP server timeouts (`requestTimeout`, `headersTimeout`, `keepAliveTimeout`) to limit slow client connections on the shared listener
- Added `actionTimeoutMs` to request handling to return `504 Request Timeout` for stuck actions and prevent late writes/unhandled errors after timeout
- Exposed the new timeout options through `useRestService`

`actionTimeoutMs` does not abort in-progress request body reads; configure server `requestTimeout`/`headersTimeout` to bound slow uploads/clients.

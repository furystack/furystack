<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- Added configurable HTTP server timeouts (`requestTimeout`, `headersTimeout`, `keepAliveTimeout`) to limit slow client connections
- Added `actionTimeoutMs` to request handling to return `504 Request Timeout` for stuck actions and clean up request scope
- Exposed the new timeout options through `useRestService`

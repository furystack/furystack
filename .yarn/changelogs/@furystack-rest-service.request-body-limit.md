<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- Enforced a configurable maximum request body size (default 1 MiB) when reading POST bodies, returning `413 Payload Too Large` for oversized requests
- Added `maxBodyBytes` option to `useRestService` for per-API configuration
- Switched request body reading to buffered chunks with single decode to avoid unbounded string growth

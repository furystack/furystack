<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- `addCorsHeaders` now adds/merges `Vary: Origin` when returning origin-specific CORS headers to avoid incorrect cache reuse

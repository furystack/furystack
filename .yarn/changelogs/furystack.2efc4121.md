<!-- version-type: patch -->

# furystack

## 🐛 Bug Fixes

- Fixed `obsoleteRange()` and `removeRange()` in `@furystack/cache` throwing when the cache contains entries in non-loaded states
- Fixed `Router` and `NestedRouter` in `@furystack/shades` not abandoning stale navigations during rapid route changes
- Fixed `@furystack/sequelize-store` returning the wrong model instance after initialization

## ♻️ Refactoring

- Replaced `semaphore-async-await` with native promise deduplication across `@furystack/cache`, `@furystack/filesystem-store`, `@furystack/mongodb-store`, `@furystack/rest-service`, `@furystack/sequelize-store`, and `@furystack/shades`

## ⬆️ Dependencies

- Removed `semaphore-async-await` from all packages

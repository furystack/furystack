# Changelog

## [12.0.28] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [12.0.27] - 2026-01-26

### 🐛 Bug Fixes

### Fixed singleton injector reference being overwritten by child injectors

The `getInstance()` method was unconditionally overwriting the injector reference on returned instances, even for singletons retrieved from a parent injector. This caused singletons to incorrectly reference the child injector that last retrieved them instead of the parent injector that created/owns them.

**Before:** When a child injector retrieved a singleton from a parent, the singleton's `injector` property was overwritten to point to the child.

**After:** The injector reference is now set at instance creation time and preserved when retrieved from parent injectors.

### 🧪 Tests

- Added regression tests to verify singleton injector references are preserved when retrieved from child injectors

## [12.0.26] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system

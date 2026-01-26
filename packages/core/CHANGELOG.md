# Changelog

## [15.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [15.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🐛 Bug Fixes

- Fixed `getPort()` returning duplicate ports by reusing a shared generator instance instead of creating a new one on each call

### 🔧 Chores

- Migrated to centralized changelog management system

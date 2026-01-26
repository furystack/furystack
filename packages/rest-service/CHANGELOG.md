# Changelog

## [11.0.1] - 2026-01-26

### 🐛 Bug Fixes

- Added `owner` parameter when creating child injectors for API request handling, improving debuggability and traceability of injector hierarchies

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [11.0.0] - 2026-01-22

### 💥 Breaking Changes

### ApiEndpointSchema structure changed

The `ApiEndpointSchema` generic type now requires endpoints to be grouped by HTTP method.

**Before:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "/entity": {...}
    }
}
```

**After:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "GET": {
            "/entity": {...}
        },
        "POST": {
            "/entity": {...}
        }
    }
}
```

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system

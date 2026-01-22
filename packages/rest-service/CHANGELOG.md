# Changelog

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

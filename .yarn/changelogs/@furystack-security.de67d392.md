<!-- version-type: major -->

# @furystack/security

## 💥 Breaking Changes

- `PasswordAuthenticator` now operates through the Repository DataSet layer instead of direct `PhysicalStore` access, ensuring authorization hooks and entity-sync events are triggered for credential and reset-token mutations
- Requires DataSets for `PasswordCredential` and `PasswordResetToken` to be registered via `getRepository(injector).createDataSet()` before instantiating `PasswordAuthenticator`

## 🔄 Migration

**Before:**

```typescript
addStore(injector, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
usePasswordPolicy(injector)
```

**After:**

```typescript
addStore(injector, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
  new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }),
)
getRepository(injector).createDataSet(PasswordCredential, 'userName')
getRepository(injector).createDataSet(PasswordResetToken, 'token')
usePasswordPolicy(injector)
```

## 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

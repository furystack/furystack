<!-- version-type: minor -->

# @furystack/security

## ♻️ Refactoring

- `PasswordAuthenticator` now operates through the Repository DataSet layer instead of direct `PhysicalStore` access, ensuring authorization hooks and entity-sync events are triggered for credential and reset-token mutations
- Requires DataSets for `PasswordCredential` and `PasswordResetToken` to be registered via `getRepository(injector).createDataSet()` before instantiating `PasswordAuthenticator`

## 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

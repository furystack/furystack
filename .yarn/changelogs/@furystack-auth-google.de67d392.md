<!-- version-type: patch -->

# @furystack/auth-google

## ♻️ Refactoring

- `GoogleLoginSettings` now uses `DataSet` and `SystemIdentityContext` instead of direct `PhysicalStore` access for user lookups

## 🧪 Tests

- Updated test setup to register DataSets for `User`, `DefaultSession`, `PasswordCredential`, and `PasswordResetToken`

## 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

<!-- version-type: patch -->

# @furystack/security

## 📚 Documentation

- Rewrote JSDoc on the error classes (`PasswordComplexityError`, `UnauthenticatedError`), the model types (`PasswordCredential`, `PasswordResetToken`), and the bundled password-complexity rules (`containsLowercase`, `containsUppercase`, `minLength`, `maxLength`) to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.

<!-- version-type: patch -->

# @furystack/security

## 🐛 Bug Fixes

- `resetPasswordForUser` now removes the reset token after a successful password reset so tokens cannot be reused
- `checkPasswordForUser` performs a dummy verification when the user does not exist to reduce username timing differences

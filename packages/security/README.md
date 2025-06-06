# @furystack/security

Password management, authentication, and authorization utilities for FuryStack

## Usage Examples

### Setup a password policy

```ts
import { usePasswordPolicy } from '@furystack/security'

usePasswordPolicy(injector, {
  passwordComplexityRules: [createMinLengthComplexityRule(8), createMaxLengthComplexityRule(64)],
  passwordExpirationDays: 90,
  resetTokenExpirationSeconds: 3600,
})
```

### Check if a user's password is valid

```ts
const authenticator = injector.getInstance(PasswordAuthenticator)

const userName = 'john_doe'
const plainPassword = 'SecureP@ssw0rd!'

const checkResult = await authenticator.checkPasswordForUser(userName, plainPassword)

if (checkResult.isValid) {
  return 'Hooray! Password is valid.'
}
if (checkResult.reason === 'badUsernameOrPassword') {
  return 'Invalid username or password.'
}
if (checkResult.reason === 'passwordExpired') {
  return 'Password has expired. Please reset it.'
}
```

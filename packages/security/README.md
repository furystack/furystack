# @furystack/security

Password management, authentication, and authorization utilities for FuryStack.

## Installation

```bash
npm install @furystack/security
# or
yarn add @furystack/security
```

## Usage Examples

### Setup a password policy

```ts
import { createInjector } from '@furystack/inject'
import { usePasswordPolicy, createMinLengthComplexityRule, createMaxLengthComplexityRule } from '@furystack/security'

const injector = createInjector()
usePasswordPolicy(injector, {
  passwordComplexityRules: [createMinLengthComplexityRule(8), createMaxLengthComplexityRule(64)],
  passwordExpirationDays: 90,
  resetTokenExpirationSeconds: 3600,
})
```

`usePasswordPolicy` binds the `SecurityPolicy` settings, the
`CryptoPasswordHasher` defaults, and the `PasswordAuthenticator` token.
Applications must also bind concrete stores for the
`PasswordCredentialStore` and `PasswordResetTokenStore` tokens (they
throw by default) before resolving anything that depends on them.

### Check if a user's password is valid

```ts
import { PasswordAuthenticator } from '@furystack/security'

const authenticator = injector.get(PasswordAuthenticator)

const userName = 'john_doe'
const plainPassword = 'SecureP@ssw0rd!'

const checkResult = await authenticator.checkPasswordForUser(userName, plainPassword)

if (checkResult.isValid) {
  console.log('Hooray! Password is valid.')
} else if (checkResult.reason === 'badUsernameOrPassword') {
  console.log('Invalid username or password.')
} else if (checkResult.reason === 'passwordExpired') {
  console.log('Password has expired. Please reset it.')
}
```

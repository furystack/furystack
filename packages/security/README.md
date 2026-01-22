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
import { Injector } from '@furystack/inject'
import { usePasswordPolicy, createMinLengthComplexityRule, createMaxLengthComplexityRule } from '@furystack/security'

const injector = new Injector()
usePasswordPolicy(injector, {
  passwordComplexityRules: [createMinLengthComplexityRule(8), createMaxLengthComplexityRule(64)],
  passwordExpirationDays: 90,
  resetTokenExpirationSeconds: 3600,
})
```

### Check if a user's password is valid

```ts
import { PasswordAuthenticator } from '@furystack/security'

const authenticator = injector.getInstance(PasswordAuthenticator)

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

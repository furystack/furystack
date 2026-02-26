import { addStore, InMemoryStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { usePasswordPolicy } from './helpers.js'
import { PasswordCredential } from './models/password-credential.js'
import { SecurityPolicyManager } from './security-policy-manager.js'

describe('SecurityPolicyManager', () => {
  it('Should return false when no token expiration has been set', async () => {
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
      usePasswordPolicy(i, { resetTokenExpirationSeconds: 0 })
      const result = i
        .getInstance(SecurityPolicyManager)
        .hasTokenExpired({ createdAt: new Date().toISOString(), token: 'token', userName: 'user' })
      expect(result).toBeFalsy()
    })
  })
})

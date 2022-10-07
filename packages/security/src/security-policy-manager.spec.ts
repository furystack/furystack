import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { usePasswordPolicy } from './helpers.js'
import { SecurityPolicyManager } from './security-policy-manager.js'
import { describe, expect, it } from 'vitest'

describe('SecurityPolicyManager', () => {
  it('Should return false when no token expiration has been set', () => {
    using(new Injector(), (i) => {
      usePasswordPolicy(i, { resetTokenExpirationSeconds: 0 })
      const result = i
        .getInstance(SecurityPolicyManager)
        .hasTokenExpired({ createdAt: new Date().toISOString(), token: 'token', userName: 'user' })
      expect(result).toBeFalsy()
    })
  })
})

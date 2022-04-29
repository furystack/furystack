import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { v4 } from 'uuid'
import { usePasswordPolicy } from './helpers'
import { SecurityPolicyManager } from './security-policy-manager'

describe('SecurityPolicyManager', () => {
  it('Should return false when no token expiration has been set', () => {
    using(new Injector(), (i) => {
      usePasswordPolicy(i, { resetTokenExpirationSeconds: 0 })
      const result = i
        .getInstance(SecurityPolicyManager)
        .hasTokenExpired({ createdAt: new Date().toISOString(), token: v4(), userName: v4() })
      expect(result).toBeFalsy()
    })
  })
})

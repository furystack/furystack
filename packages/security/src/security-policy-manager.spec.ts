import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { usePasswordPolicy } from './helpers.js'
import { SecurityPolicyManager } from './security-policy-manager.js'

describe('SecurityPolicyManager', () => {
  it('returns a cached manager backed by the current policy', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i, { passwordExpirationDays: 30 })
      const manager = i.get(SecurityPolicyManager)
      expect(manager.policy.passwordExpirationDays).toBe(30)
    })
  })

  it('never considers a token expired when resetTokenExpirationSeconds is 0', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i, { resetTokenExpirationSeconds: 0 })
      const expired = i
        .get(SecurityPolicyManager)
        .hasTokenExpired({ createdAt: new Date(0).toISOString(), token: 'token', userName: 'user' })
      expect(expired).toBe(false)
    })
  })

  it('flags a token as expired once its lifetime has elapsed', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i, { resetTokenExpirationSeconds: 1 })
      const pastCreatedAt = new Date()
      pastCreatedAt.setSeconds(pastCreatedAt.getSeconds() - 10)
      const expired = i
        .get(SecurityPolicyManager)
        .hasTokenExpired({ createdAt: pastCreatedAt.toISOString(), token: 'token', userName: 'user' })
      expect(expired).toBe(true)
    })
  })

  it('never considers a credential expired when passwordExpirationDays is 0', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i, { passwordExpirationDays: 0 })
      const expired = i.get(SecurityPolicyManager).hasPasswordExpired({
        userName: 'user',
        passwordHash: 'hash',
        salt: 'salt',
        creationDate: new Date(0).toISOString(),
      })
      expect(expired).toBe(false)
    })
  })

  it('flags a credential as expired once its lifetime has elapsed', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i, { passwordExpirationDays: 1 })
      const pastCreationDate = new Date()
      pastCreationDate.setDate(pastCreationDate.getDate() - 5)
      const expired = i.get(SecurityPolicyManager).hasPasswordExpired({
        userName: 'user',
        passwordHash: 'hash',
        salt: 'salt',
        creationDate: pastCreationDate.toISOString(),
      })
      expect(expired).toBe(true)
    })
  })

  it('reports match=true when no complexity rules are configured', async () => {
    await usingAsync(createInjector(), async (i) => {
      usePasswordPolicy(i)
      const result = await i.get(SecurityPolicyManager).matchPasswordComplexityRules('anything')
      expect(result.match).toBe(true)
    })
  })
})

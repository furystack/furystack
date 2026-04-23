import { InMemoryStore } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { randomBytes } from 'crypto'
import { describe, expect, it, vi } from 'vitest'
import { PasswordComplexityError } from './errors/password-complexity-error.js'
import { UnauthenticatedError } from './errors/unauthenticated-error.js'
import { usePasswordPolicy } from './helpers.js'
import type { PasswordCheckFailedResult } from './models/password-check-result.js'
import { PasswordCredential } from './models/password-credential.js'
import { PasswordResetToken } from './models/password-reset-token.js'
import { PasswordAuthenticator } from './password-authenticator.js'
import { PasswordCredentialStore, PasswordResetTokenStore } from './password-credential-store.js'
import { createMinLengthComplexityRule } from './password-complexity-rules/min-length.js'
import { SecurityPolicyManager } from './security-policy-manager.js'

const randomString = () => randomBytes(32).toString('hex')

/**
 * Binds a fresh in-memory implementation of the two credential stores. The
 * production default factories throw on purpose; tests opt in to memory
 * persistence explicitly per injector.
 */
const useInMemorySecurityStores = (i: Injector) => {
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
}

describe('PasswordAuthenticator', () => {
  it('resolves to a configured authenticator when stores and policy are set up', async () => {
    await usingAsync(createInjector(), async (i) => {
      useInMemorySecurityStores(i)
      usePasswordPolicy(i)
      const auth = i.get(PasswordAuthenticator)
      expect(auth.policyManager).toBeDefined()
      expect(auth.hasher).toBeDefined()
    })
  })

  it('picks up complexity rules supplied via usePasswordPolicy', async () => {
    await usingAsync(createInjector(), async (i) => {
      useInMemorySecurityStores(i)
      usePasswordPolicy(i, { passwordComplexityRules: [createMinLengthComplexityRule(3)] })
      const auth = i.get(PasswordAuthenticator)
      expect(auth.policyManager.policy.passwordComplexityRules[0].name).toBe('minLength')
    })
  })

  describe('checkPasswordForUser', () => {
    it('returns isValid=true for a valid username and password combination', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const password = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, password)
        await i.get(PasswordCredentialStore).add(credential)

        expect((await authenticator.checkPasswordForUser(userName, password)).isValid).toBe(true)
      })
    })

    it('returns badUsernameOrPassword for an unknown username', async () => {
      await usingAsync(createInjector(), async (i) => {
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential('someone', 'pw')
        await i.get(PasswordCredentialStore).add(credential)

        const failure = (await authenticator.checkPasswordForUser('nobody', 'pw')) as PasswordCheckFailedResult
        expect(failure.isValid).toBe(false)
        expect(failure.reason).toBe('badUsernameOrPassword')
      })
    })

    it('returns badUsernameOrPassword for the wrong password', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, 'right')
        await i.get(PasswordCredentialStore).add(credential)

        const failure = (await authenticator.checkPasswordForUser(userName, 'wrong')) as PasswordCheckFailedResult
        expect(failure.isValid).toBe(false)
        expect(failure.reason).toBe('badUsernameOrPassword')
      })
    })

    it('returns passwordExpired for a credential older than the configured expiration window', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const password = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i, { passwordExpirationDays: 1 })
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, password)
        const olderCreationDate = new Date()
        olderCreationDate.setDate(olderCreationDate.getDate() - 2)
        credential.creationDate = olderCreationDate.toISOString()
        await i.get(PasswordCredentialStore).add(credential)

        const failure = (await authenticator.checkPasswordForUser(userName, password)) as PasswordCheckFailedResult
        expect(failure.isValid).toBe(false)
        expect(failure.reason).toBe('passwordExpired')
      })
    })
  })

  describe('setPasswordForUser', () => {
    it('rotates the credential and keeps only the latest entry', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const store = i.get(PasswordCredentialStore)
        const complexitySpy = vi.spyOn(i.get(SecurityPolicyManager), 'matchPasswordComplexityRules')
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await store.add(credential)

        await authenticator.setPasswordForUser(userName, lastPassword, password)

        expect(complexitySpy).toHaveBeenCalled()
        expect(await store.count({ userName: { $eq: userName } })).toBe(1)
        expect((await authenticator.checkPasswordForUser(userName, password)).isValid).toBe(true)
        expect(
          ((await authenticator.checkPasswordForUser(userName, lastPassword)) as PasswordCheckFailedResult).reason,
        ).toBe('badUsernameOrPassword')
      })
    })

    it('throws PasswordComplexityError when the new password fails a complexity rule', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i, { passwordComplexityRules: [createMinLengthComplexityRule(3)] })
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await i.get(PasswordCredentialStore).add(credential)

        await expect(authenticator.setPasswordForUser(userName, lastPassword, '')).rejects.toBeInstanceOf(
          PasswordComplexityError,
        )
        expect((await authenticator.checkPasswordForUser(userName, lastPassword)).isValid).toBe(true)
      })
    })

    it('throws UnauthenticatedError when the previous password does not verify', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await i.get(PasswordCredentialStore).add(credential)

        await expect(authenticator.setPasswordForUser(userName, 'wrong', randomString())).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
        expect((await authenticator.checkPasswordForUser(userName, lastPassword)).isValid).toBe(true)
      })
    })
  })

  describe('resetPasswordForUser', () => {
    it('rotates the credential when the token is valid', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = randomString()
        const token = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await i.get(PasswordCredentialStore).add(credential)
        await i.get(PasswordResetTokenStore).add({ userName, createdAt: new Date().toISOString(), token })

        await authenticator.resetPasswordForUser(token, password)

        expect((await authenticator.checkPasswordForUser(userName, password)).isValid).toBe(true)
        expect(
          ((await authenticator.checkPasswordForUser(userName, lastPassword)) as PasswordCheckFailedResult).reason,
        ).toBe('badUsernameOrPassword')
      })
    })

    it('throws PasswordComplexityError and preserves the stored credential on complexity failure', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const token = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i, { passwordComplexityRules: [createMinLengthComplexityRule(3)] })
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await i.get(PasswordCredentialStore).add(credential)
        await i.get(PasswordResetTokenStore).add({ userName, createdAt: new Date().toISOString(), token })

        await expect(authenticator.resetPasswordForUser(token, '')).rejects.toBeInstanceOf(PasswordComplexityError)
        expect((await authenticator.checkPasswordForUser(userName, lastPassword)).isValid).toBe(true)
      })
    })

    it('throws UnauthenticatedError when the token does not exist', async () => {
      await usingAsync(createInjector(), async (i) => {
        useInMemorySecurityStores(i)
        usePasswordPolicy(i)
        const authenticator = i.get(PasswordAuthenticator)

        await expect(authenticator.resetPasswordForUser('unknown', 'pw')).rejects.toBeInstanceOf(UnauthenticatedError)
      })
    })

    it('throws UnauthenticatedError and removes the expired token', async () => {
      await usingAsync(createInjector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const token = randomString()
        useInMemorySecurityStores(i)
        usePasswordPolicy(i, { resetTokenExpirationSeconds: 1 })
        const authenticator = i.get(PasswordAuthenticator)
        const credential = await authenticator.hasher.createCredential(userName, lastPassword)
        await i.get(PasswordCredentialStore).add(credential)
        const pastCreatedAt = new Date()
        pastCreatedAt.setDate(pastCreatedAt.getDate() - 2)
        await i.get(PasswordResetTokenStore).add({ userName, createdAt: pastCreatedAt.toISOString(), token })

        await expect(authenticator.resetPasswordForUser(token, randomString())).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
        expect(await i.get(PasswordResetTokenStore).count()).toBe(0)
      })
    })
  })
})

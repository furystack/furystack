import { addStore, InMemoryStore, StoreManager, User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'
import { usePasswordPolicy } from './helpers.js'
import type { PasswordCheckFailedResult } from './models/password-check-result.js'
import { PasswordAuthenticator } from './password-authenticator.js'
import { createMinLengthComplexityRule } from './password-complexity-rules/min-length.js'
import { SecurityPolicyManager } from './security-policy-manager.js'
import { PasswordComplexityError } from './errors/password-complexity-error.js'
import { randomBytes } from 'crypto'
import { describe, it, expect, vi } from 'vitest'
import { PasswordCredential } from './models/password-credential.js'
import { UnauthenticatedError } from './errors/unauthenticated-error.js'
import { PasswordResetToken } from './models/password-reset-token.js'

const randomString = () => randomBytes(32).toString('hex')

describe('PasswordAuthenticator', () => {
  it('Should be instantiated', () => {
    using(new Injector(), (i) => {
      const auth = i.getInstance(PasswordAuthenticator)
      expect(auth).toBeInstanceOf(PasswordAuthenticator)
    })
  })

  it('Should inherit policy from the extension method', () => {
    using(new Injector(), (i) => {
      usePasswordPolicy(i, {
        passwordComplexityRules: [createMinLengthComplexityRule(3)],
      })
      const auth = i.getInstance(PasswordAuthenticator)
      expect(auth).toBeInstanceOf(PasswordAuthenticator)
      expect(auth.policyManager.policy.passwordComplexityRules[0].name).toBe('minLength')
    })
  })

  describe('checkPasswordForUser', () => {
    it('Should return a truthy value for valid username and password', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const password = randomString()

        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )
        usePasswordPolicy(i, {})
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')

        const entry = await hasher.createCredential(userName, password)
        await passwordStore.add(entry)

        const successResult = await authenticator.checkPasswordForUser(userName, password)
        expect(successResult.isValid).toBeTruthy()
      })
    })

    it('Should return a falsy value for invalid username', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const password = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )

        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')

        const entry = await hasher.createCredential(userName, password)
        await passwordStore.add(entry)

        const failResult = await authenticator.checkPasswordForUser('invalidUsername', password)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })

    it('Should return a falsy value for invalid password', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const password = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )
        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')

        const entry = await hasher.createCredential(userName, password)
        await passwordStore.add(entry)

        const failResult = await authenticator.checkPasswordForUser(userName, 'someInvalidPassword')
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })

    it('Should return a falsy value for an expired password', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const password = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )

        usePasswordPolicy(i, { passwordExpirationDays: 1 })
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')

        const entry = await hasher.createCredential(userName, password)

        const creationDate = new Date()
        creationDate.setDate(creationDate.getDate() - 2)

        entry.creationDate = creationDate.toISOString()

        await passwordStore.add(entry)

        const failResult = await authenticator.checkPasswordForUser(userName, password)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('passwordExpired')
      })
    })
  })
  describe('setPasswordForUser', () => {
    it('Should be able to set the password for the user using the last password', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )
        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const policyManager = i.getInstance(SecurityPolicyManager)
        const pmSpy = vi.spyOn(policyManager, 'matchPasswordComplexityRules')

        const entry = await hasher.createCredential(userName, lastPassword)

        await passwordStore.add(entry)
        await authenticator.setPasswordForUser(userName, lastPassword, password)

        expect(pmSpy).toBeCalled()

        const entryCount = await passwordStore.count({ userName: { $eq: userName } })

        expect(entryCount).toBe(1) // old entry should be removed

        const successResult = await authenticator.checkPasswordForUser(userName, password)
        expect(successResult.isValid).toBeTruthy()

        // Password updated, cannot use the last password
        const failResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })

    it('Should throw PasswordComplexityError if the complexity rules are not respected', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = ''
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )
        usePasswordPolicy(i, { passwordComplexityRules: [createMinLengthComplexityRule(3)] })
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const policyManager = i.getInstance(SecurityPolicyManager)
        const pmSpy = vi.spyOn(policyManager, 'matchPasswordComplexityRules')

        const entry = await hasher.createCredential(userName, lastPassword)

        await passwordStore.add(entry)

        await expect(authenticator.setPasswordForUser(userName, lastPassword, password)).rejects.toThrowError(
          PasswordComplexityError,
        )

        expect(pmSpy).toBeCalled()

        const entryCount = await passwordStore.count({ userName: { $eq: userName } })

        expect(entryCount).toBe(1) // old entry should be removed

        const failResult = await authenticator.checkPasswordForUser(userName, password)
        // Password NOT updated, can use the last password
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')

        // Password NOT updated, cannot use the new password
        const successResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(successResult.isValid).toBeTruthy()
      })
    })

    it('Should throw UnauthenticatedError if the last password is not valid', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
          new InMemoryStore({ model: User, primaryKey: 'username' }),
        )
        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const policyManager = i.getInstance(SecurityPolicyManager)
        const pmSpy = vi.spyOn(policyManager, 'matchPasswordComplexityRules')

        const entry = await hasher.createCredential(userName, lastPassword)

        await passwordStore.add(entry)

        await expect(authenticator.setPasswordForUser(userName, 'someBadLastPassword', password)).rejects.toThrowError(
          UnauthenticatedError,
        )

        expect(pmSpy).toBeCalled()

        const entryCount = await passwordStore.count({ userName: { $eq: userName } })

        expect(entryCount).toBe(1) // old entry should be removed

        const failResult = await authenticator.checkPasswordForUser(userName, password)
        // Password NOT updated, can use the last password
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')

        // Password NOT updated, cannot use the new password
        const successResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(successResult.isValid).toBeTruthy()
      })
    })
  })

  describe('resetPasswordForUser', () => {
    it('Should reset the password with the valid token', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = randomString()
        const token = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
          .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
          .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const resetTokenStore = i.getInstance(StoreManager).getStoreFor(PasswordResetToken, 'token')

        const entry = await hasher.createCredential(userName, lastPassword)
        await passwordStore.add(entry)
        await resetTokenStore.add({ userName, createdAt: new Date().toISOString(), token })

        await authenticator.resetPasswordForUser(token, password)

        const successResult = await authenticator.checkPasswordForUser(userName, password)
        expect(successResult.isValid).toBeTruthy()

        // Password updated, cannot use the last password
        const failResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })
    it('Should throw PasswordComplexityError if the complexity rules are not respected', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = ''
        const token = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
          .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
          .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
        usePasswordPolicy(i, { passwordComplexityRules: [createMinLengthComplexityRule(3)] })
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const resetTokenStore = i.getInstance(StoreManager).getStoreFor(PasswordResetToken, 'token')

        const entry = await hasher.createCredential(userName, lastPassword)
        await passwordStore.add(entry)
        await resetTokenStore.add({ userName, createdAt: new Date().toISOString(), token })

        await expect(authenticator.resetPasswordForUser(token, password)).rejects.toThrowError(PasswordComplexityError)
        const successResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(successResult.isValid).toBeTruthy()

        // Password updated, cannot use the last password
        const failResult = await authenticator.checkPasswordForUser(userName, password)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })
    it('Should throw UnauthenticatedError if the token is not valid', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = ''
        const token = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
          .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
          .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
        usePasswordPolicy(i)
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const resetTokenStore = i.getInstance(StoreManager).getStoreFor(PasswordResetToken, 'token')

        const entry = await hasher.createCredential(userName, lastPassword)
        await passwordStore.add(entry)
        await resetTokenStore.add({ userName, createdAt: new Date().toISOString(), token })

        await expect(authenticator.resetPasswordForUser('someBadToken', password)).rejects.toThrowError(
          UnauthenticatedError,
        )
        const successResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(successResult.isValid).toBeTruthy()

        // Password updated, cannot use the last password
        const failResult = await authenticator.checkPasswordForUser(userName, password)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')
      })
    })
    it('Should throw UnauthenticatedError and clean up token if the token has been expired', async () => {
      await usingAsync(new Injector(), async (i) => {
        const userName = randomString()
        const lastPassword = randomString()
        const password = ''
        const token = randomString()
        addStore(i, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
          .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
          .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))
        usePasswordPolicy(i, { resetTokenExpirationSeconds: 1 })
        const authenticator = i.getInstance(PasswordAuthenticator)
        const hasher = authenticator.getHasher()
        const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
        const resetTokenStore = i.getInstance(StoreManager).getStoreFor(PasswordResetToken, 'token')

        const entry = await hasher.createCredential(userName, lastPassword)
        await passwordStore.add(entry)

        const creationDate = new Date()
        creationDate.setDate(creationDate.getDate() - 2)

        await resetTokenStore.add({ userName, createdAt: creationDate.toISOString(), token })

        await expect(authenticator.resetPasswordForUser(token, password)).rejects.toThrowError(UnauthenticatedError)
        const successResult = await authenticator.checkPasswordForUser(userName, lastPassword)
        expect(successResult.isValid).toBeTruthy()

        // Password updated, cannot use the last password
        const failResult = await authenticator.checkPasswordForUser(userName, password)
        expect(failResult.isValid).toBeFalsy()
        expect((failResult as PasswordCheckFailedResult).reason).toBe('badUsernameOrPassword')

        const tokenCount = await resetTokenStore.count()
        expect(tokenCount).toBe(0)
      })
    })
  })
})

import { InMemoryStore, StoreManager, User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { using, usingAsync } from '@furystack/utils'

import { v4 } from 'uuid'
import { PasswordCheckFailedResult, PasswordCredential } from './models'
import { PasswordAuthenticator } from './password-authenticator'
import { createMinLengthComplexityRule } from './password-complexity-rules'
import { SecurityPolicyManager } from './security-policy-manager'

describe('PasswordAuthenticator', () => {
  it('Should be instantiated', () => {
    using(new Injector(), (i) => {
      const auth = i.getInstance(PasswordAuthenticator)
      expect(auth).toBeInstanceOf(PasswordAuthenticator)
    })
  })

  it('Should inherit policy from the extension method', () => {
    using(new Injector(), (i) => {
      i.usePasswordPolicy({
        passwordComplexityRules: [createMinLengthComplexityRule(3)],
      })
      const auth = i.getInstance(PasswordAuthenticator)
      expect(auth).toBeInstanceOf(PasswordAuthenticator)
      expect(auth.policyManager.policy.passwordComplexityRules[0].name).toBe('minLength')
    })
  })

  it('Should be able to set the  password for the user using the last password', async () => {
    await usingAsync(new Injector(), async (i) => {
      const userName = v4()
      const lastPassword = v4()
      const password = v4()
      i.setupStores((sm) =>
        sm
          .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
          .addStore(new InMemoryStore({ model: User, primaryKey: 'username' })),
      )
      i.usePasswordPolicy({})
      const authenticator = i.getInstance(PasswordAuthenticator)
      const hasher = authenticator.getHasher()
      const passwordStore = i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')
      const policyManager = i.getInstance(SecurityPolicyManager)
      const pmSpy = jest.spyOn(policyManager, 'matchPasswordComplexityRules')

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
})

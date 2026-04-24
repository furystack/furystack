import { InMemoryStore } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { PasswordCredential } from './models/password-credential.js'
import { PasswordResetToken } from './models/password-reset-token.js'
import {
  PasswordCredentialDataSet,
  PasswordCredentialStore,
  PasswordResetTokenDataSet,
  PasswordResetTokenStore,
  SecurityStoreNotConfiguredError,
} from './password-credential-store.js'

describe('PasswordCredentialStore', () => {
  it('exposes the PasswordCredential model and userName primary key on the token', () => {
    expect(PasswordCredentialStore.model).toBe(PasswordCredential)
    expect(PasswordCredentialStore.primaryKey).toBe('userName')
    expect(PasswordCredentialStore.lifetime).toBe('singleton')
  })

  it('throws SecurityStoreNotConfiguredError when resolved without an override', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(PasswordCredentialStore)).toThrow(SecurityStoreNotConfiguredError)
      expect(() => injector.get(PasswordCredentialStore)).toThrow(/PasswordCredentialStore.*not been configured/)
    })
  })

  it('returns the bound implementation after rebinding the token', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const impl = new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })
      injector.bind(PasswordCredentialStore, () => impl)
      expect(injector.get(PasswordCredentialStore)).toBe(impl)
    })
  })
})

describe('PasswordResetTokenStore', () => {
  it('exposes the PasswordResetToken model and token primary key on the token', () => {
    expect(PasswordResetTokenStore.model).toBe(PasswordResetToken)
    expect(PasswordResetTokenStore.primaryKey).toBe('token')
    expect(PasswordResetTokenStore.lifetime).toBe('singleton')
  })

  it('throws SecurityStoreNotConfiguredError when resolved without an override', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(PasswordResetTokenStore)).toThrow(SecurityStoreNotConfiguredError)
      expect(() => injector.get(PasswordResetTokenStore)).toThrow(/PasswordResetTokenStore.*not been configured/)
    })
  })

  it('returns the bound implementation after rebinding the token', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const impl = new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' })
      injector.bind(PasswordResetTokenStore, () => impl)
      expect(injector.get(PasswordResetTokenStore)).toBe(impl)
    })
  })
})

describe('PasswordCredentialDataSet / PasswordResetTokenDataSet', () => {
  it('mirror the backing store metadata onto the data-set token', () => {
    expect(PasswordCredentialDataSet.model).toBe(PasswordCredential)
    expect(PasswordCredentialDataSet.primaryKey).toBe('userName')
    expect(PasswordResetTokenDataSet.model).toBe(PasswordResetToken)
    expect(PasswordResetTokenDataSet.primaryKey).toBe('token')
  })
})

describe('SecurityStoreNotConfiguredError', () => {
  it('embeds the store name in the message and sets the error name', () => {
    const error = new SecurityStoreNotConfiguredError('SomeStore')
    expect(error.name).toBe('SecurityStoreNotConfiguredError')
    expect(error.message).toContain('SomeStore')
    expect(error).toBeInstanceOf(Error)
  })
})

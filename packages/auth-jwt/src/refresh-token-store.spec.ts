import { InMemoryStore } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { RefreshToken } from './models/refresh-token.js'
import { JwtStoreNotConfiguredError, RefreshTokenDataSet, RefreshTokenStore } from './refresh-token-store.js'

describe('RefreshTokenStore', () => {
  it('exposes the RefreshToken model and token primary key on the token', () => {
    expect(RefreshTokenStore.model).toBe(RefreshToken)
    expect(RefreshTokenStore.primaryKey).toBe('token')
    expect(RefreshTokenStore.lifetime).toBe('singleton')
  })

  it('throws JwtStoreNotConfiguredError when resolved without an override', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(RefreshTokenStore)).toThrow(JwtStoreNotConfiguredError)
      expect(() => injector.get(RefreshTokenStore)).toThrow(/RefreshTokenStore.*not been configured/)
    })
  })

  it('returns the bound implementation after rebinding the token', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const impl = new InMemoryStore({ model: RefreshToken, primaryKey: 'token' })
      injector.bind(RefreshTokenStore, () => impl)
      expect(injector.get(RefreshTokenStore)).toBe(impl)
    })
  })
})

describe('RefreshTokenDataSet', () => {
  it('mirrors the backing store metadata onto the data-set token', () => {
    expect(RefreshTokenDataSet.model).toBe(RefreshToken)
    expect(RefreshTokenDataSet.primaryKey).toBe('token')
  })

  it('resolves through the bound store implementation', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(RefreshTokenStore, () => new InMemoryStore({ model: RefreshToken, primaryKey: 'token' }))
      const dataSet = injector.get(RefreshTokenDataSet)
      await dataSet.add(injector, {
        token: 'token-1',
        username: 'alice',
        createdAt: new Date(Date.now() - 1_000).toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })
      const result = await dataSet.get(injector, 'token-1')
      expect(result?.username).toBe('alice')
    })
  })
})

describe('JwtStoreNotConfiguredError', () => {
  it('embeds the store name in the message and sets the error name', () => {
    const error = new JwtStoreNotConfiguredError('RefreshTokenStore')
    expect(error.name).toBe('JwtStoreNotConfiguredError')
    expect(error.message).toContain('RefreshTokenStore')
    expect(error).toBeInstanceOf(Error)
  })
})

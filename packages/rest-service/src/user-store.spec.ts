import { InMemoryStore, User } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { DefaultSession } from './models/default-session.js'
import {
  HttpAuthenticationStoreNotConfiguredError,
  SessionDataSet,
  SessionStore,
  UserDataSet,
  UserStore,
} from './user-store.js'

describe('UserStore', () => {
  it('exposes the User model and username primary key on the token', () => {
    expect(UserStore.model).toBe(User)
    expect(UserStore.primaryKey).toBe('username')
    expect(UserStore.lifetime).toBe('singleton')
  })

  it('throws HttpAuthenticationStoreNotConfiguredError when resolved without an override', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(UserStore)).toThrow(HttpAuthenticationStoreNotConfiguredError)
      expect(() => injector.get(UserStore)).toThrow(/UserStore.*not been configured/)
    })
  })

  it('returns the bound implementation after rebinding the token', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const impl = new InMemoryStore({ model: User, primaryKey: 'username' })
      injector.bind(UserStore, () => impl)
      expect(injector.get(UserStore)).toBe(impl)
    })
  })
})

describe('SessionStore', () => {
  it('exposes the DefaultSession model and sessionId primary key on the token', () => {
    expect(SessionStore.model).toBe(DefaultSession)
    expect(SessionStore.primaryKey).toBe('sessionId')
    expect(SessionStore.lifetime).toBe('singleton')
  })

  it('throws HttpAuthenticationStoreNotConfiguredError when resolved without an override', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(SessionStore)).toThrow(HttpAuthenticationStoreNotConfiguredError)
      expect(() => injector.get(SessionStore)).toThrow(/SessionStore.*not been configured/)
    })
  })

  it('returns the bound implementation after rebinding the token', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const impl = new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })
      injector.bind(SessionStore, () => impl)
      expect(injector.get(SessionStore)).toBe(impl)
    })
  })
})

describe('UserDataSet / SessionDataSet', () => {
  it('mirror the backing store metadata onto the data-set token', () => {
    expect(UserDataSet.model).toBe(User)
    expect(UserDataSet.primaryKey).toBe('username')
    expect(SessionDataSet.model).toBe(DefaultSession)
    expect(SessionDataSet.primaryKey).toBe('sessionId')
  })

  it('resolves through the bound store implementation', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(UserStore, () => new InMemoryStore({ model: User, primaryKey: 'username' }))
      const dataSet = injector.get(UserDataSet)
      await dataSet.add(injector, { username: 'alice', roles: [] })
      const result = await dataSet.get(injector, 'alice')
      expect(result?.username).toBe('alice')
    })
  })
})

describe('HttpAuthenticationStoreNotConfiguredError', () => {
  it('embeds the store name in the message and sets the error name', () => {
    const error = new HttpAuthenticationStoreNotConfiguredError('SomeStore')
    expect(error.name).toBe('HttpAuthenticationStoreNotConfiguredError')
    expect(error.message).toContain("'SomeStore'")
    expect(error).toBeInstanceOf(Error)
  })
})

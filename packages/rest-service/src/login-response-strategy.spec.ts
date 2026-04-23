import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel, useSystemIdentityContext } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { useHttpAuthentication } from './helpers.js'
import { createCookieLoginStrategy } from './login-response-strategy.js'
import { DefaultSession } from './models/default-session.js'
import { SessionDataSet, SessionStore, UserStore } from './user-store.js'

const setupInjector = (i: Injector) => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i)
}

describe('createCookieLoginStrategy', () => {
  const testUser: User = { username: 'testuser', roles: ['admin'] }

  it('returns the user as the response body', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.chunk).toEqual(testUser)
    })
  })

  it('returns status code 200', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      expect(result.statusCode).toBe(200)
    })
  })

  it('emits a Set-Cookie header with the generated session id', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      const result = await strategy.createLoginResponse(testUser, i)
      const setCookie = result.headers['Set-Cookie']
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('fss=')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).toContain('HttpOnly')
    })
  })

  it('persists the session via SessionDataSet', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)
      await strategy.createLoginResponse(testUser, i)

      await usingAsync(useSystemIdentityContext({ injector: i, username: 'spec' }), async (systemScope) => {
        const sessionDataSet = systemScope.get(SessionDataSet)
        const sessions = await sessionDataSet.find(systemScope, { filter: { username: { $eq: 'testuser' } } })
        expect(sessions).toHaveLength(1)
        expect(sessions[0].username).toBe('testuser')
        expect(sessions[0].sessionId).toBeTruthy()
      })
    })
  })

  it('creates unique session ids for each call', async () => {
    await usingAsync(createInjector(), async (i) => {
      setupInjector(i)
      const strategy = createCookieLoginStrategy(i)

      const result1 = await strategy.createLoginResponse(testUser, i)
      const result2 = await strategy.createLoginResponse(testUser, i)

      const sessionId1 = result1.headers['Set-Cookie']?.split('=')[1]?.split(';')[0]
      const sessionId2 = result2.headers['Set-Cookie']?.split('=')[1]?.split(';')[0]
      expect(sessionId1).not.toBe(sessionId2)
    })
  })
})

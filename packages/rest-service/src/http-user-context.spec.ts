import type { User } from '@furystack/core'
import { InMemoryStore, User as UserModel, useSystemIdentityContext } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import {
  PasswordAuthenticator,
  PasswordCredential,
  PasswordCredentialStore,
  PasswordResetToken,
  PasswordResetTokenStore,
  UnauthenticatedError,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { useHttpAuthentication } from './helpers.js'
import { HttpUserContext } from './http-user-context.js'
import { DefaultSession } from './models/default-session.js'
import { SessionDataSet, SessionStore, UserStore } from './user-store.js'

/**
 * Binds in-memory implementations for every persistent token required by
 * the authentication subsystem (users, sessions, credentials, reset tokens)
 * on the provided injector, then installs the default password policy and
 * HTTP-authentication stack.
 */
export const prepareInjector = (i: Injector, options?: { enableBasicAuth?: boolean }): void => {
  i.bind(UserStore, () => new InMemoryStore({ model: UserModel, primaryKey: 'username' }))
  i.bind(SessionStore, () => new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
  i.bind(PasswordCredentialStore, () => new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
  i.bind(PasswordResetTokenStore, () => new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i, { enableBasicAuth: options?.enableBasicAuth ?? true })
}

const setupUser = async (i: Injector, userName: string, password: string): Promise<void> => {
  const authenticator = i.get(PasswordAuthenticator)
  const credential = await authenticator.hasher.createCredential(userName, password)
  await i.get(PasswordCredentialStore).add(credential)
  await i.get(UserStore).add({ username: userName, roles: [] })
}

describe('HttpUserContext', () => {
  const request = { headers: {} } as IncomingMessage
  const testUser: User = { username: 'testUser', roles: ['grantedRole1', 'grantedRole2'] }

  it('resolves to an HttpUserContext via the DI token', async () => {
    await usingAsync(createInjector(), async (i) => {
      prepareInjector(i)
      const ctx = i.get(HttpUserContext)
      expect(ctx).toBeDefined()
      expect(ctx.authentication).toBeDefined()
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when the cached user is present', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        expect(await ctx.isAuthenticated(request)).toBe(true)
        expect(ctx.getCurrentUser).toHaveBeenCalled()
      })
    })

    it('returns false when getCurrentUser rejects', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => {
          throw new Error(':(')
        })
        expect(await ctx.isAuthenticated(request)).toBe(false)
      })
    })
  })

  describe('isAuthorized', () => {
    it('returns true when the current user has every requested role', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        expect(await ctx.isAuthorized(request, 'grantedRole1', 'grantedRole2')).toBe(true)
      })
    })

    it('returns false when any requested role is missing', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        expect(await ctx.isAuthorized(request, 'grantedRole1', 'otherRole')).toBe(false)
      })
    })
  })

  describe('authenticateUser', () => {
    it('throws UnauthenticatedError when the credential store is empty', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await expect(i.get(HttpUserContext).authenticateUser('user', 'password')).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
      })
    })

    it('throws UnauthenticatedError when the password does not match', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        await expect(i.get(HttpUserContext).authenticateUser('user', 'wrong')).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
      })
    })

    it('throws UnauthenticatedError for an unknown username', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await setupUser(i, 'otherUser', 'pass123')
        await expect(i.get(HttpUserContext).authenticateUser('user', 'pass123')).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
      })
    })

    it('throws UnauthenticatedError when the user exists only as a credential', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        await i.get(UserStore).remove('user')
        await expect(i.get(HttpUserContext).authenticateUser('user', 'pass123')).rejects.toBeInstanceOf(
          UnauthenticatedError,
        )
      })
    })

    it('returns the user on valid credentials', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        expect(await i.get(HttpUserContext).authenticateUser('user', 'pass123')).toEqual({
          username: 'user',
          roles: [],
        })
      })
    })
  })

  describe('getSessionIdFromRequest', () => {
    it('returns null when no headers are present', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        expect(i.get(HttpUserContext).getSessionIdFromRequest(request)).toBeNull()
      })
    })

    it('returns null when no session cookie is present', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const requestWithCookie = { headers: { cookie: 'a=2;b=3;' } } as unknown as IncomingMessage
        expect(i.get(HttpUserContext).getSessionIdFromRequest(requestWithCookie)).toBeNull()
      })
    })

    it('returns the session id when the configured cookie is present', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const requestWithAuthCookie = {
          headers: { cookie: `a=2;b=3;${ctx.authentication.cookieName}=666;c=4;` },
        } as unknown as IncomingMessage
        expect(ctx.getSessionIdFromRequest(requestWithAuthCookie)).toBe('666')
      })
    })
  })

  describe('authenticateRequest', () => {
    it('authenticates with Basic Auth when enabled and credentials are valid', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        await setupUser(i, 'testuser', 'password')
        const result = await i.get(HttpUserContext).authenticateRequest({
          headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
        })
        expect(result.username).toBe('testuser')
      })
    })

    it('does not attempt Basic Auth when it is disabled', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i, { enableBasicAuth: false })
        await setupUser(i, 'testuser', 'password')
        await expect(
          i.get(HttpUserContext).authenticateRequest({
            headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
          }),
        ).rejects.toBeInstanceOf(UnauthenticatedError)
      })
    })

    it('throws when the cookie session id does not exist', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        await expect(
          ctx.authenticateRequest({
            headers: { cookie: `${ctx.authentication.cookieName}=666;` },
          }),
        ).rejects.toBeInstanceOf(UnauthenticatedError)
      })
    })

    it('authenticates via cookie when the session id matches a stored user', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        await i.get(SessionStore).add({ sessionId: '666', username: testUser.username })
        await i.get(UserStore).add({ ...testUser })

        const result = await ctx.authenticateRequest({
          headers: { cookie: `${ctx.authentication.cookieName}=666;` },
        })
        expect(result).toEqual(testUser)
      })
    })

    it('walks providers in order and stops at the first match', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const provider1 = vi.fn(async () => null)
        const provider2 = vi.fn(async () => testUser)
        ctx.authentication.authenticationProviders = [
          { name: 'test-1', authenticate: provider1 },
          { name: 'test-2', authenticate: provider2 },
        ]
        const result = await ctx.authenticateRequest(request)
        expect(provider1).toHaveBeenCalledOnce()
        expect(provider2).toHaveBeenCalledOnce()
        expect(result).toBe(testUser)
      })
    })

    it('propagates a provider-thrown error and skips remaining providers', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const provider1 = vi.fn(async () => {
          throw new UnauthenticatedError()
        })
        const provider2 = vi.fn(async () => testUser)
        ctx.authentication.authenticationProviders = [
          { name: 'test-1', authenticate: provider1 },
          { name: 'test-2', authenticate: provider2 },
        ]
        await expect(ctx.authenticateRequest(request)).rejects.toBeInstanceOf(UnauthenticatedError)
        expect(provider2).not.toHaveBeenCalled()
      })
    })

    it('throws UnauthenticatedError when no provider returns a user', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        ctx.authentication.authenticationProviders = [{ name: 'test-1', authenticate: async () => null }]
        await expect(ctx.authenticateRequest(request)).rejects.toBeInstanceOf(UnauthenticatedError)
      })
    })
  })

  describe('getCurrentUser', () => {
    it('caches the result of authenticateRequest by session id when the cookie provider yields a key', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const cookiedRequest = {
          headers: { cookie: `${ctx.authentication.cookieName}=session-1;` },
        } as IncomingMessage
        ctx.authenticateRequest = vi.fn(async () => testUser)
        const first = await ctx.getCurrentUser(cookiedRequest)
        const second = await ctx.getCurrentUser(cookiedRequest)
        expect(ctx.authenticateRequest).toHaveBeenCalledTimes(1)
        expect(first).toBe(testUser)
        expect(second).toBe(testUser)
      })
    })

    it('treats distinct sessions as distinct cache entries', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const otherUser: User = { username: 'otherUser', roles: [] }
        const requestA = {
          headers: { cookie: `${ctx.authentication.cookieName}=session-a;` },
        } as IncomingMessage
        const requestB = {
          headers: { cookie: `${ctx.authentication.cookieName}=session-b;` },
        } as IncomingMessage
        const authenticateRequest = vi
          .fn<(req: Pick<IncomingMessage, 'headers'>) => Promise<User>>()
          .mockResolvedValueOnce(testUser)
          .mockResolvedValueOnce(otherUser)
        ctx.authenticateRequest = authenticateRequest
        expect(await ctx.getCurrentUser(requestA)).toBe(testUser)
        expect(await ctx.getCurrentUser(requestB)).toBe(otherUser)
        expect(await ctx.getCurrentUser(requestA)).toBe(testUser)
        expect(authenticateRequest).toHaveBeenCalledTimes(2)
      })
    })

    it('bypasses the cache when no provider yields a key (e.g. Basic Auth, anonymous)', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const anonRequest = { headers: {} } as IncomingMessage
        const authenticateRequest = vi
          .fn<(req: Pick<IncomingMessage, 'headers'>) => Promise<User>>()
          .mockResolvedValue(testUser)
        ctx.authenticateRequest = authenticateRequest
        await ctx.getCurrentUser(anonRequest)
        await ctx.getCurrentUser(anonRequest)
        expect(authenticateRequest).toHaveBeenCalledTimes(2)
      })
    })

    it('drops the local cache entry on cookieLogout so the next request re-authenticates', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const sessionId = 'session-logout'
        const cookiedRequest = {
          headers: { cookie: `${ctx.authentication.cookieName}=${sessionId};` },
        } as IncomingMessage
        await i.get(SessionStore).add({ sessionId, username: testUser.username })
        await i.get(UserStore).add(testUser)

        const authenticateRequest = vi
          .fn<(req: Pick<IncomingMessage, 'headers'>) => Promise<User>>()
          .mockResolvedValue(testUser)
        ctx.authenticateRequest = authenticateRequest

        await ctx.getCurrentUser(cookiedRequest)
        expect(authenticateRequest).toHaveBeenCalledTimes(1)

        await ctx.cookieLogout(cookiedRequest, { setHeader: vi.fn() })

        await ctx.getCurrentUser(cookiedRequest)
        expect(authenticateRequest).toHaveBeenCalledTimes(2)
      })
    })

    it('re-walks providers after a failed authenticateRequest', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const authenticateRequest = vi
          .fn<(req: Pick<IncomingMessage, 'headers'>) => Promise<User>>()
          .mockRejectedValueOnce(new UnauthenticatedError())
          .mockResolvedValueOnce(testUser)
        ctx.authenticateRequest = authenticateRequest
        await expect(ctx.getCurrentUser(request)).rejects.toBeInstanceOf(UnauthenticatedError)
        expect(await ctx.getCurrentUser(request)).toBe(testUser)
        expect(authenticateRequest).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('cookieLogin / cookieLogout', () => {
    it('persists the session, sets the cookie and emits onLogin', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const setHeader = vi.fn()
        const onLogin = vi.fn()
        ctx.addListener('onLogin', onLogin)

        const result = await ctx.cookieLogin(testUser, { setHeader })
        expect(result).toBe(testUser)
        expect(setHeader).toHaveBeenCalledTimes(1)
        expect(onLogin).toHaveBeenCalledWith({ user: testUser })

        await usingAsync(useSystemIdentityContext({ injector: i, username: 'spec' }), async (systemScope) => {
          const sessionDataSet = systemScope.get(SessionDataSet)
          expect(await sessionDataSet.count(systemScope)).toBe(1)
        })
      })
    })

    it('clears the session cookie, removes the stored session and emits onLogout', async () => {
      await usingAsync(createInjector(), async (i) => {
        prepareInjector(i)
        const ctx = i.get(HttpUserContext)
        const onLogout = vi.fn()
        ctx.addListener('onLogout', onLogout)

        let sessionId = ''
        await ctx.cookieLogin(testUser, {
          setHeader: (_name, value) => {
            sessionId = value.split('=')[1].split(';')[0]
          },
        })

        const logoutSetHeader = vi.fn()
        await ctx.cookieLogout(
          { headers: { cookie: `${ctx.authentication.cookieName}=${sessionId};` } },
          { setHeader: logoutSetHeader },
        )
        expect(logoutSetHeader).toHaveBeenCalledWith(
          'Set-Cookie',
          `${ctx.authentication.cookieName}=; Path=/; HttpOnly`,
        )
        expect(onLogout).toHaveBeenCalledWith(undefined)

        await usingAsync(useSystemIdentityContext({ injector: i, username: 'spec' }), async (systemScope) => {
          const sessionDataSet = systemScope.get(SessionDataSet)
          expect(await sessionDataSet.count(systemScope)).toBe(0)
        })
      })
    })
  })
})

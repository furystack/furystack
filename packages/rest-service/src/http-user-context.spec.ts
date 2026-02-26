/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InMemoryStore, StoreManager, User, addStore, useSystemIdentityContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { getDataSetFor } from '@furystack/repository'
import {
  PasswordAuthenticator,
  PasswordCredential,
  PasswordResetToken,
  UnauthenticatedError,
  usePasswordPolicy,
} from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { useHttpAuthentication } from './helpers.js'
import { HttpUserContext } from './http-user-context.js'
import { DefaultSession } from './models/default-session.js'

export const prepareInjector = async (i: Injector, options?: { enableBasicAuth?: boolean }) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
    .addStore(new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }))

  usePasswordPolicy(i)
  useHttpAuthentication(i, { enableBasicAuth: options?.enableBasicAuth ?? true })
}

const setupUser = async (i: Injector, userName: string, password: string) => {
  const sm = i.getInstance(StoreManager)
  const pw = i.getInstance(PasswordAuthenticator)
  const cred = await pw.hasher.createCredential(userName, password)
  await sm.getStoreFor(PasswordCredential, 'userName').add(cred)
  await sm.getStoreFor(User, 'username').add({ username: userName, roles: [] })
}

describe('HttpUserContext', () => {
  const request = { headers: {} } as IncomingMessage
  const response = {} as any as ServerResponse

  const testUser: User = { username: 'testUser', roles: ['grantedRole1', 'grantedRole2'] }

  it('Should be constructed with the extension method', async () => {
    await usingAsync(new Injector(), async (i) => {
      await prepareInjector(i)
      const ctx = i.getInstance(HttpUserContext)
      expect(ctx).toBeInstanceOf(HttpUserContext)
    })
  })

  describe('isAuthenticated', () => {
    it('Should return true for authenticated users', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        const value = await ctx.isAuthenticated(request)
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false for unauthenticated users', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => {
          throw Error(':(')
        })
        await expect(ctx.isAuthenticated(request)).resolves.toEqual(false)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('isAuthorized', () => {
    it('Should return true if all roles are authorized', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        const value = await ctx.isAuthorized(request, 'grantedRole1', 'grantedRole2')
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false if not all roles are authorized', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = vi.fn(async () => testUser)
        const value = await ctx.isAuthorized(request, 'grantedRole1', 'nonGrantedRole2')
        expect(value).toBe(false)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('authenticateUser', () => {
    it('Should fail when the store is empty', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        await expect(ctx.authenticateUser('user', 'password')).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should fail when the password not equals', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        await expect(i.getInstance(HttpUserContext).authenticateUser('user', 'pass321')).rejects.toThrowError(
          UnauthenticatedError,
        )
      })
    })

    it('Should fail when the username not equals', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'otherUser', 'pass123')
        await expect(i.getInstance(HttpUserContext).authenticateUser('user', 'pass123')).rejects.toThrowError(
          UnauthenticatedError,
        )
      })
    })

    it('Should fail when password not provided', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        await expect(i.getInstance(HttpUserContext).authenticateUser('user', '')).rejects.toThrowError(
          UnauthenticatedError,
        )
      })
    })

    it('Should fail when the user is not in the user store', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        await i.getInstance(StoreManager).getStoreFor(User, 'username').remove('user')
        await expect(i.getInstance(HttpUserContext).authenticateUser('user', 'pass123')).rejects.toThrowError(
          UnauthenticatedError,
        )
      })
    })

    it('Should return the user when the username and password matches', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'user', 'pass123')
        const ctx = i.getInstance(HttpUserContext)
        const value = await ctx.authenticateUser('user', 'pass123')
        expect(value).toEqual({ username: 'user', roles: [] })
      })
    })
  })

  describe('getSessionIdFromRequest', () => {
    it('Should return null if no headers present', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx.getSessionIdFromRequest(request)
        expect(sid).toBeNull()
      })
    })

    it('Should return null if no session ID cookie present', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const requestWithCookie = { ...request, cookie: 'a=2;b=3;c=4;' } as unknown as IncomingMessage
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx.getSessionIdFromRequest(requestWithCookie)
        expect(sid).toBeNull()
      })
    })
    it('Should return the Session ID value if session ID cookie present', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const requestWithAuthCookie = {
          ...request,
          headers: { cookie: `a=2;b=3;${ctx.authentication.cookieName}=666;c=4;` },
        } as unknown as IncomingMessage

        const sid = ctx.getSessionIdFromRequest(requestWithAuthCookie)
        expect(sid).toBe('666')
      })
    })
  })

  describe('authenticateRequest', () => {
    it('Should authenticate with Basic Auth when enabled and valid credentials provided', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        await setupUser(i, 'testuser', 'password')
        const ctx = i.getInstance(HttpUserContext)
        const result = await ctx.authenticateRequest({
          headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
        } as IncomingMessage)
        expect(result.username).toBe('testuser')
      })
    })

    it('Should NOT try to authenticate with Basic when disabled', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i, { enableBasicAuth: false })
        await setupUser(i, 'testuser', 'password')
        const ctx = i.getInstance(HttpUserContext)
        await expect(
          ctx.authenticateRequest({
            headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
          } as IncomingMessage),
        ).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should fail with no session in the store', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        await expect(
          ctx.authenticateRequest({
            headers: { cookie: `${ctx.authentication.cookieName}=666;a=3` },
          } as IncomingMessage),
        ).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should fail with valid session Id but no user', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        await i.getInstance(StoreManager).getStoreFor(DefaultSession, 'sessionId').add({
          sessionId: '666',
          username: testUser.username,
        })
        await expect(
          ctx.authenticateRequest({
            headers: { cookie: `${ctx.authentication.cookieName}=666;a=3` },
          } as IncomingMessage),
        ).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should authenticate with cookie, if the session IDs matches', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)

        const ctx = i.getInstance(HttpUserContext)
        await i.getInstance(StoreManager).getStoreFor(DefaultSession, 'sessionId').add({
          sessionId: '666',
          username: testUser.username,
        })

        await i
          .getInstance(StoreManager)
          .getStoreFor(User, 'username')
          .add({ ...testUser })

        const result = await ctx.authenticateRequest({
          headers: { cookie: `${ctx.authentication.cookieName}=666;a=3` },
        } as IncomingMessage)

        expect(result).toEqual(testUser)
      })
    })

    it('Should iterate providers and return null results pass to next', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
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

    it('Should throw if provider throws (skipping remaining providers)', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const provider1 = vi.fn(async () => {
          throw new UnauthenticatedError()
        })
        const provider2 = vi.fn(async () => testUser)
        ctx.authentication.authenticationProviders = [
          { name: 'test-1', authenticate: provider1 },
          { name: 'test-2', authenticate: provider2 },
        ]
        await expect(ctx.authenticateRequest(request)).rejects.toThrowError(UnauthenticatedError)
        expect(provider2).not.toHaveBeenCalled()
      })
    })

    it('Should throw UnauthenticatedError if no provider returns a user', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication.authenticationProviders = [{ name: 'test-1', authenticate: async () => null }]
        await expect(ctx.authenticateRequest(request)).rejects.toThrowError(UnauthenticatedError)
      })
    })
  })

  describe('getCurrentUser', () => {
    it('Should return the current user from authenticateRequest() once per request', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authenticateRequest = vi.fn(async () => testUser)
        const result = await ctx.getCurrentUser(request)
        const result2 = await ctx.getCurrentUser(request)
        expect(ctx.authenticateRequest).toBeCalledTimes(1)
        expect(result).toBe(testUser)
        expect(result2).toBe(testUser)
      })
    })
  })

  describe('cookieLogin', () => {
    it('Should return the current user from authenticateRequest() once per request', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const setHeader = vi.fn()
        const addMock = vi.fn(async () => ({}))
        // @ts-expect-error
        ctx.getSessionDataSet = vi.fn(() => ({ add: addMock }))
        const authResult = await ctx.cookieLogin(testUser, { setHeader })
        expect(authResult).toBe(testUser)
        expect(setHeader).toBeCalled()
        expect(addMock).toBeCalled()
      })
    })
  })

  describe('cookieLogout', () => {
    it('Should invalidate the current session id cookie', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const setHeader = vi.fn()
        const removeMock = vi.fn(async () => undefined)
        const sessionDataSetMock = {
          add: vi.fn(async () => ({})),
          find: vi.fn(async () => [{ sessionId: 'example-session-id' }]),
          remove: removeMock,
          primaryKey: 'sessionId' as const,
        }
        // @ts-expect-error
        ctx.getSessionDataSet = vi.fn(() => sessionDataSetMock)
        ctx.authenticateRequest = vi.fn(async () => testUser)
        ctx.getSessionIdFromRequest = () => 'example-session-id'
        response.setHeader = vi.fn(() => response)
        await ctx.cookieLogin(testUser, { setHeader })
        await ctx.cookieLogout(request, response)
        expect(response.setHeader).toBeCalledWith('Set-Cookie', 'fss=; Path=/; HttpOnly')
        expect(removeMock).toBeCalled()
      })
    })
  })

  describe('Changes in the store during the context lifetime', () => {
    it('Should update user roles', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sm = i.getInstance(StoreManager)
        await sm.getStoreFor(User, 'username').add(testUser)

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await sm.getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, { setHeader: vi.fn() })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const userDataSet = getDataSetFor(systemInjector, User, 'username')
        const updatedUser = { ...testUser, roles: ['newFancyRole'] }
        await userDataSet.update(systemInjector, testUser.username, updatedUser)
        const updatedUserFromContext = await ctx.getCurrentUser(request)
        expect(updatedUserFromContext.roles).toEqual(['newFancyRole'])

        await userDataSet.update(systemInjector, testUser.username, { ...updatedUser, roles: [] })
        const reloadedUserFromContext = await ctx.getCurrentUser(request)
        expect(reloadedUserFromContext.roles).toEqual([])
      })
    })

    it('Should remove current user when the user is removed from the store', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sm = i.getInstance(StoreManager)
        await sm.getStoreFor(User, 'username').add(testUser)

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await sm.getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, { setHeader: vi.fn() })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const userDataSet = getDataSetFor(systemInjector, User, 'username')
        await userDataSet.remove(systemInjector, testUser.username)

        await expect(() => ctx.getCurrentUser(request)).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should remove current user when the session is removed from the store', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sm = i.getInstance(StoreManager)
        await sm.getStoreFor(User, 'username').add(testUser)

        let sessionId = ''

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await sm.getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, {
          setHeader: (_headerName, headerValue) => {
            sessionId = headerValue.split('=')[1].split(';')[0]
            return {} as ServerResponse
          },
        })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        const systemInjector = useSystemIdentityContext({ injector: i, username: 'test' })
        const sessionDataSet = getDataSetFor(systemInjector, DefaultSession, 'sessionId')
        await sessionDataSet.remove(systemInjector, sessionId)

        await expect(() => ctx.getCurrentUser(request)).rejects.toThrowError(UnauthenticatedError)
      })
    })
  })
})

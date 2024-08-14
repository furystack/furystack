/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InMemoryStore, StoreManager, User, addStore } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { PasswordAuthenticator, PasswordCredential, UnauthenticatedError } from '@furystack/security'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { useHttpAuthentication } from './helpers.js'
import { HttpUserContext } from './http-user-context.js'
import { DefaultSession } from './models/default-session.js'

export const prepareInjector = async (i: Injector) => {
  addStore(i, new InMemoryStore({ model: User, primaryKey: 'username' }))
    .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }))
    .addStore(new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))

  useHttpAuthentication(i)
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
    it('Should try to authenticate with Basic, if enabled', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authenticateUser = vi.fn(async () => testUser)
        const result = await ctx.authenticateRequest({
          headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
        } as IncomingMessage)
        expect(ctx.authenticateUser).toBeCalledWith('testuser', 'password')
        expect(result).toBe(testUser)
      })
    })

    it('Should NOT try to authenticate with Basic, if disabled', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication.enableBasicAuth = false
        ctx.authenticateUser = vi.fn(async () => testUser)
        await expect(
          ctx.authenticateRequest({
            headers: { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` },
          } as IncomingMessage),
        ).rejects.toThrowError(UnauthenticatedError)
        expect(ctx.authenticateUser).not.toBeCalled()
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
        await ctx.authentication
          .getSessionStore(i.getInstance(StoreManager))
          .add({ sessionId: '666', username: testUser.username })
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
        await ctx.authentication
          .getSessionStore(i.getInstance(StoreManager))
          .add({ sessionId: '666', username: testUser.username })

        await ctx.authentication.getUserStore(i.getInstance(StoreManager)).add({ ...testUser })

        const result = await ctx.authenticateRequest({
          headers: { cookie: `${ctx.authentication.cookieName}=666;a=3` },
        } as IncomingMessage)

        expect(result).toEqual(testUser)
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
        // @ts-expect-error
        ctx.getSessionStore().add = vi.fn(async () => {
          return {}
        })
        const authResult = await ctx.cookieLogin(testUser, { setHeader })
        expect(authResult).toBe(testUser)
        expect(setHeader).toBeCalled()
        expect(ctx.getSessionStore().add).toBeCalled()
      })
    })
  })

  describe('cookieLogout', () => {
    it('Should invalidate the current session id cookie', async () => {
      await usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const setHeader = vi.fn()
        // @ts-expect-error
        ctx.getSessionStore().add = vi.fn(async () => {
          return {}
        })
        ctx.authenticateRequest = vi.fn(async () => testUser)
        ctx.getSessionStore().remove = vi.fn(async () => undefined)
        ctx.getSessionIdFromRequest = () => 'example-session-id'
        response.setHeader = vi.fn(() => response)
        await ctx.cookieLogin(testUser, { setHeader })
        await ctx.cookieLogout(request, response)
        expect(response.setHeader).toBeCalledWith('Set-Cookie', 'fss=; Path=/; HttpOnly')
        expect(ctx.getSessionStore().remove).toBeCalled()
      })
    })
  })

  describe('Changes in the store during the context lifetime', () => {
    it('Should update user roles', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
        await userStore.add(testUser)

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, { setHeader: vi.fn() })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        const updatedUser = { ...testUser, roles: ['newFancyRole'] }
        await userStore.update(testUser.username, updatedUser)
        const updatedUserFromContext = await ctx.getCurrentUser(request)
        expect(updatedUserFromContext.roles).toEqual(['newFancyRole'])

        await userStore.update(testUser.username, { ...updatedUser, roles: [] })
        const reloadedUserFromContext = await ctx.getCurrentUser(request)
        expect(reloadedUserFromContext.roles).toEqual([])
      })
    })

    it('Should remove current user when the user is removed from the store', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
        await userStore.add(testUser)

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, { setHeader: vi.fn() })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        await userStore.remove(testUser.username)

        await expect(() => ctx.getCurrentUser(request)).rejects.toThrowError(UnauthenticatedError)
      })
    })

    it('Should remove current user when the session is removed from the store', () => {
      return usingAsync(new Injector(), async (i) => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const userStore = i.getInstance(StoreManager).getStoreFor(User, 'username')
        await userStore.add(testUser)

        let sessionId = ''

        const pw = await i.getInstance(PasswordAuthenticator).hasher.createCredential(testUser.username, 'test')
        await i.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName').add(pw)

        await ctx.cookieLogin(testUser, {
          setHeader: (_headerName, headerValue) => {
            sessionId = headerValue
            return {} as ServerResponse
          },
        })

        const originalUser = await ctx.getCurrentUser(request)
        expect(originalUser).toEqual(testUser)

        const sessionStore = ctx.getSessionStore()
        await sessionStore.remove(sessionId)

        await expect(() => ctx.getCurrentUser(request)).rejects.toThrowError(UnauthenticatedError)
      })
    })
  })
})

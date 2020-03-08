/* eslint-disable prettier/prettier */
import { IncomingMessage, ServerResponse } from 'http'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { User, StoreManager, InMemoryStore } from '@furystack/core'
import { DefaultSession } from './models/default-session'
import { HttpUserContext } from './http-user-context'
import './injector-extensions'
import '@furystack/logging'

export const prepareInjector = async (i: Injector) => {
  i.setupStores(sm =>
    sm
      .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
      .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
  )
  i.setExplicitInstance({ headers: {} }, IncomingMessage)
  i.setExplicitInstance({}, ServerResponse)
  i.useHttpAuthentication()
  // await i.getInstance(ServerManager).getOrCreate({ port: 19999 })
}

describe('HttpUserContext', () => {
  const testUser: User = { username: 'testUser', roles: ['grantedRole1', 'grantedRole2'] }

  it('Should be constructed with the extension method', async () => {
    await usingAsync(new Injector(), async i => {
      await prepareInjector(i)
      const ctx = i.getInstance(HttpUserContext)
      expect(ctx).toBeInstanceOf(HttpUserContext)
    })
  })

  describe('isAuthenticated', () => {
    it('Should return true for authenticated users', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthenticated()
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false for unauthenticated users', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => {
          throw Error(':(')
        })
        await expect(ctx.isAuthenticated()).resolves.toEqual(false)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('isAuthorized', () => {
    it('Should return true if all roles are authorized', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthorized('grantedRole1', 'grantedRole2')
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false if not all roles are authorized', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthorized('grantedRole1', 'nonGrantedRole2')
        expect(value).toBe(false)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('authenticateUser', () => {
    it('Should fail when the store is empty', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        await expect(ctx.authenticateUser('user', 'password')).rejects.toThrow('')
      })
    })

    it('Should fail when the password not equals', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'user', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        await expect(ctx.authenticateUser('user', 'pass321')).rejects.toThrow('')
      })
    })

    it('Should fail when the username not equals', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'otherUser', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        expect(ctx.authenticateUser('user', 'pass123')).rejects.toThrow('')
      })
    })

    it('Should fail when password not provided', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'otherUser', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        await expect(ctx.authenticateUser('user', '')).rejects.toThrow('')
      })
    })

    it('Should return the user without the password hash when the username and password matches', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const store = ctx.authentication.getUserStore(i.getInstance(StoreManager))
        const loginUser = { username: 'user', roles: [] }
        store.add({ ...loginUser, password: ctx.authentication.hashMethod('pass123') })
        const value = await ctx.authenticateUser('user', 'pass123')
        expect(value).toEqual(loginUser)
      })
    })
  })

  describe('getSessionIdFromRequest', () => {
    it('Should return null if no headers present', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx.getSessionIdFromRequest()
        expect(sid).toBeNull()
      })
    })

    it('Should return null if no session ID cookie present', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        i.getInstance(IncomingMessage).headers = { cookie: 'a=2;b=3;c=4;' }
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx.getSessionIdFromRequest()
        expect(sid).toBeNull()
      })
    })
    it('Should return the Session ID value if session ID cookie present', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `a=2;b=3;${ctx.authentication.cookieName}=666;c=4;` }

        const sid = ctx.getSessionIdFromRequest()
        expect(sid).toBe('666')
      })
    })
  })

  describe('authenticateRequest', () => {
    it('Should try to authenticate with Basic, if enabled', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` }
        ctx.authenticateUser = jest.fn(async () => testUser)
        const result = await ctx.authenticateRequest()
        expect(ctx.authenticateUser).toBeCalledWith('testuser', 'password')
        expect(result).toBe(testUser)
      })
    })

    it('Should NOT try to authenticate with Basic, if disabled', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication.enableBasicAuth = false
        i.getInstance(IncomingMessage).headers = { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` }
        ctx.authenticateUser = jest.fn(async () => testUser)
        await expect(ctx.authenticateRequest()).rejects.toThrow('')
        expect(ctx.authenticateUser).not.toBeCalled()
      })
    })

    it('Should fail with no session in the store', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `${ctx.authentication.cookieName}=666;a=3` }

        await expect(ctx.authenticateRequest()).rejects.toThrow('')
      })
    })

    it('Should fail with valid session Id but no user', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `${ctx.authentication.cookieName}=666;a=3` }
        ctx.authentication
          .getSessionStore(i.getInstance(StoreManager))
          .add({ sessionId: '666', username: testUser.username })
        await expect(ctx.authenticateRequest()).rejects.toThrow('')
      })
    })

    it('Should authenticate with cookie, if the session IDs matches', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `${ctx.authentication.cookieName}=666;a=3` }
        ctx.authentication
          .getSessionStore(i.getInstance(StoreManager))
          .add({ sessionId: '666', username: testUser.username })

        ctx.authentication.getUserStore(i.getInstance(StoreManager)).add({ ...testUser, password: '' })

        const result = await ctx.authenticateRequest()

        expect(result).toEqual(testUser)
      })
    })
  })

  describe('getCurrentUser', () => {
    it('Should return the current user from authenticateRequest() once per request', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authenticateRequest = jest.fn(async () => testUser)
        const result = await ctx.getCurrentUser()
        const result2 = await ctx.getCurrentUser()
        expect(ctx.authenticateRequest).toBeCalledTimes(1)
        expect(result).toBe(testUser)
        expect(result2).toBe(testUser)
      })
    })
  })

  describe('cookieLogin', () => {
    it('Should return the current user from authenticateRequest() once per request', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const setHeader = jest.fn()
        ctx.sessions.add = jest.fn(async s => s)
        const authResult = await ctx.cookieLogin(testUser, { setHeader } as any)
        expect(authResult).toBe(testUser)
        expect(setHeader).toBeCalled()
        expect(ctx.sessions.add).toBeCalled()
      })
    })
  })

  describe('cookieLogout', () => {
    it('Should invalidate the current session id cookie', async () => {
      await usingAsync(new Injector(), async i => {
        await prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const setHeader = jest.fn()
        ctx.sessions.add = jest.fn(async s => s)
        ctx.authenticateRequest = jest.fn(async () => testUser)
        ctx.sessions.remove = jest.fn(async () => undefined)
        ctx.getSessionIdFromRequest = () => 'example-session-id'
        ctx.serverResponse.setHeader = jest.fn(() => undefined)
        await ctx.cookieLogin(testUser, { setHeader } as any)
        await ctx.cookieLogout()
        expect(ctx.serverResponse.setHeader).toBeCalledWith('Set-Cookie', 'fss=; Path=/; HttpOnly')
        expect(ctx.sessions.remove).toBeCalled()
      })
    })
  })
})

/* eslint-disable prettier/prettier */
import { IncomingMessage, ServerResponse } from 'http'
import { using, usingAsync } from '@sensenet/client-utils'
import { Injector } from '@furystack/inject'
import { User, visitorUser, StoreManager } from '@furystack/core'
import { HttpUserContext } from '../src'

export const prepareInjector = (i: Injector) => {
  i.setExplicitInstance({ headers: {} }, IncomingMessage)
  i.setExplicitInstance({}, ServerResponse)
  i.useHttpApi().useHttpAuthentication()
}

describe('HttpUserContext', () => {
  const testUser: User = { username: 'testUser', roles: ['grantedRole1', 'grantedRole2'] }

  it('Should be constructed with the extension method', () => {
    using(new Injector(), i => {
      prepareInjector(i)
      const ctx = i.getInstance(HttpUserContext)
      expect(ctx).toBeInstanceOf(HttpUserContext)
    })
  })

  describe('isAuthenticated', () => {
    it('Should return true for authenticated users', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthenticated()
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false for visitor users', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => visitorUser)
        const value = await ctx.isAuthenticated()
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('isAuthorized', () => {
    it('Should return true if all roles are authorized', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthorized('grantedRole1', 'grantedRole2')
        expect(value).toBe(true)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })

    it('Should return false if not all roles are authorized', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.getCurrentUser = jest.fn(async () => testUser)
        const value = await ctx.isAuthorized('grantedRole1', 'nonGrantedRole2')
        expect(value).toBe(false)
        expect(ctx.getCurrentUser).toBeCalled()
      })
    })
  })

  describe('authenticateUser', () => {
    it('Should return the Visitor when the store is empty', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const value = await ctx.authenticateUser('user', 'password')
        expect(value).toBe(ctx.authentication.visitorUser)
      })
    })

    it('Should return the Visitor when the password not equals', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'user', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        const value = await ctx.authenticateUser('user', 'pass321')
        expect(value).toBe(ctx.authentication.visitorUser)
      })
    })

    it('Should return the Visitor when the username not equals', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'otherUser', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        const value = await ctx.authenticateUser('user', 'pass123')
        expect(value).toBe(ctx.authentication.visitorUser)
      })
    })

    it('Should return the Visitor when password not provided', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication
          .getUserStore(i.getInstance(StoreManager))
          .add({ username: 'otherUser', password: ctx.authentication.hashMethod('pass123'), roles: [] })
        const value = await ctx.authenticateUser('user', '')
        expect(value).toBe(ctx.authentication.visitorUser)
      })
    })

    it('Should return the user without the password hash when the username and password matches', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
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
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx['getSessionIdFromRequest']()
        expect(sid).toBeNull()
      })
    })

    it('Should return null if no session ID cookie present', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        i.getInstance(IncomingMessage).headers = { cookie: 'a=2;b=3;c=4;' }
        const ctx = i.getInstance(HttpUserContext)
        const sid = ctx['getSessionIdFromRequest']()
        expect(sid).toBeNull()
      })
    })
    it('Should return the Session ID value if session ID cookie present', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `a=2;b=3;${ctx.authentication.cookieName}=666;c=4;` }

        const sid = ctx['getSessionIdFromRequest']()
        expect(sid).toBe('666')
      })
    })
  })

  describe('authenticateRequest', () => {
    it('Should try to authenticate with Basic, if enabled', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
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
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        ctx.authentication.enableBasicAuth = false
        i.getInstance(IncomingMessage).headers = { authorization: `Basic dGVzdHVzZXI6cGFzc3dvcmQ=` }
        ctx.authenticateUser = jest.fn(async () => testUser)
        const result = await ctx.authenticateRequest()
        expect(ctx.authenticateUser).not.toBeCalled()
        expect(result).toBe(ctx.authentication.visitorUser)
      })
    })

    it('Should fail with no session in the store', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `${ctx.authentication.cookieName}=666;a=3` }
        const result = await ctx.authenticateRequest()
        expect(result).toEqual(ctx.authentication.visitorUser)
      })
    })

    it('Should fail with valid session Id but no user', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
        const ctx = i.getInstance(HttpUserContext)
        i.getInstance(IncomingMessage).headers = { cookie: `${ctx.authentication.cookieName}=666;a=3` }
        ctx.authentication
          .getSessionStore(i.getInstance(StoreManager))
          .add({ sessionId: '666', username: testUser.username })

        const result = await ctx.authenticateRequest()

        expect(result).toEqual(ctx.authentication.visitorUser)
      })
    })

    it('Should authenticate with cookie, if the session IDs matches', async () => {
      await usingAsync(new Injector(), async i => {
        prepareInjector(i)
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
})

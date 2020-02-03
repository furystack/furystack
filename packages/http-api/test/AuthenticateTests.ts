import { IncomingMessage } from 'http'
import { Authenticate, EmptyResult, HttpUserContext } from '../src'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'

describe('Authenticate', () => {
  it('Should return 403 w/o basic auth header, when unauthorized and basic auth is disabled', async () => {
    await usingAsync(new Injector(), async i => {
      const isAuthenticatedAction = jest.fn(async () => false)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        {
          isAuthenticated: isAuthenticatedAction,
          getCurrentUser: async () => Promise.reject(':('),
          authentication: { enableBasicAuth: false },
        },
        HttpUserContext,
      )
      const exampleAuthenticatedAction = jest.fn(async (_i: Injector) => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)

      const result = await authorized(i)
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toBe(JSON.stringify({ error: 'unauthorized' }))
      expect(result.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(exampleAuthenticatedAction).not.toBeCalled()
    })
  })

  it('Should return 403 with basic auth headers when unauthorized and basic auth is enabled', async () => {
    await usingAsync(new Injector(), async i => {
      const isAuthenticatedAction = jest.fn(async () => false)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        {
          isAuthenticated: isAuthenticatedAction,
          getCurrentUser: async () => Promise.reject(':('),
          authentication: { enableBasicAuth: true },
        },
        HttpUserContext,
      )
      const exampleAuthenticatedAction = jest.fn(async (_i: Injector) => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)

      const result = await authorized(i)
      expect(result.statusCode).toBe(401)
      expect(result.chunk).toBe(JSON.stringify({ error: 'unauthorized' }))
      expect(result.headers).toEqual({ 'Content-Type': 'application/json', 'WWW-Authenticate': 'Basic' })
      expect(exampleAuthenticatedAction).not.toBeCalled()
    })
  })

  it('Should exec the original action if authorized', async () => {
    await usingAsync(new Injector(), async i => {
      const isAuthenticatedAction = jest.fn(async () => true)
      i.setExplicitInstance({ url: 'http://google.com' }, IncomingMessage)
      i.setExplicitInstance(
        { isAuthenticated: isAuthenticatedAction, getCurrentUser: async () => Promise.reject(':(') },
        HttpUserContext,
      )
      const exampleAuthenticatedAction = jest.fn(async (_i: Injector) => EmptyResult())
      const authorized = Authenticate()(exampleAuthenticatedAction)

      const result = await authorized(i)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(exampleAuthenticatedAction).toBeCalledWith(i)
    })
  })
})

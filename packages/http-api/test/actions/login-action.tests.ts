import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext, LoginAction } from '../../src'

describe('LoginAction', () => {
  /** */
  it('Returns the provided user with 200 on success', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance(
        {
          authenticateUser: jest.fn(async () => testUser),
          cookieLogin: jest.fn(async () => testUser),
          authentication: {},
        },
        HttpUserContext,
      )
      i.setExplicitInstance({ readPostBody: async () => ({}) }, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      const result = await LoginAction(i)
      expect(result.chunk).toBe(JSON.stringify(testUser))
      expect(result.statusCode).toBe(200)
    })
  })

  it('Returns error with 400 on fail', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ cookieLogin: async () => Promise.reject(':(') }, HttpUserContext)
      i.setExplicitInstance({ readPostBody: async () => ({}) }, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      const result = await LoginAction(i)
      expect(result.statusCode).toBe(400)
      expect(result.chunk).toBe(JSON.stringify({ message: 'Login failed' }))
    })
  })
})

import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { LoginAction } from './login'
import { HttpUserContext } from '../http-user-context'

describe('LoginAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('Returns the provided user with 200 on success', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance(
        {
          authenticateUser: jest.fn(async () => testUser),
          cookieLogin: jest.fn(async () => testUser),
          authentication: {},
        },
        HttpUserContext,
      )
      const result = await LoginAction({
        request,
        response,
        injector: i,
        getBody: async () => ({ username: 'testuser', password: 'alma' }),
      })
      expect(result.chunk).toEqual(testUser)
      expect(result.statusCode).toBe(200)
    })
  })

  it('Returns throw error with 400 on fail', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance({ cookieLogin: async () => Promise.reject(':(') }, HttpUserContext)
      await expect(
        LoginAction({ request, response, injector: i, getBody: async () => ({ username: '', password: '' }) }),
      ).rejects.toThrowError('Login Failed')
    })
  })
})

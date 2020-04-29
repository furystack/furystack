import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { GetCurrentUser } from './get-current-user'
import { HttpUserContext } from '../http-user-context'
import { IncomingMessage, ServerResponse } from 'http'

describe('getCurrentUser', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('exec', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance(
        { getCurrentUser: async () => testUser, isAuthenticated: async () => true },
        HttpUserContext,
      )
      const result = await GetCurrentUser({ injector: i, request, response })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual(testUser)
    })
  })
})

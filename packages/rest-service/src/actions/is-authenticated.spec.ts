import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { IsAuthenticated } from './is-authenticated'
import { HttpUserContext } from '../http-user-context'
import { IncomingMessage, ServerResponse } from 'http'

describe('isAuthenticated', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse
  it('exec', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.setExplicitInstance({ isAuthenticated: async () => true }, HttpUserContext)
      const result = await IsAuthenticated({ injector: i, request, response })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual({ isAuthenticated: true })
    })
  })
})

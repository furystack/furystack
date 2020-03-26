import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ErrorAction } from './error-action'
import '@furystack/logging'
import { IncomingMessage } from 'http'
import { RequestError } from '@furystack/rest'
import { AuthorizationError } from '@furystack/core'

describe('ErrorAction tests', () => {
  it('returns the error in the standard format', async () => {
    await usingAsync(new Injector().useLogging(), async (i) => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)

      const result = await ErrorAction({ injector: i, getBody: async () => new Error('Something went wrong') })
      expect(result.statusCode).toBe(500)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })

  it('returns the error code from request errors', async () => {
    await usingAsync(new Injector().useLogging(), async (i) => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)

      const result = await ErrorAction({
        injector: i,
        getBody: async () => new RequestError('Something went wrong', 401),
      })
      expect(result.statusCode).toBe(401)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })

  it('returns the 403 for authorization errors', async () => {
    await usingAsync(new Injector().useLogging(), async (i) => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)

      const result = await ErrorAction({
        injector: i,
        getBody: async () => new AuthorizationError('Something went wrong'),
      })
      expect(result.statusCode).toBe(403)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })
})

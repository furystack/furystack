import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ErrorAction } from './error-action'
import '@furystack/logging'
import { IncomingMessage } from 'http'

describe('ErrorAction tests', () => {
  it('returns the error in the standard format', async () => {
    await usingAsync(new Injector().useLogging(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)

      const result = await ErrorAction({ injector: i, getBody: async () => new Error('Something went wrong') })
      expect(result.statusCode).toBe(500)
      expect(result.chunk.message).toBe('Something went wrong')
      expect(result.chunk.url).toBe('https://google.com')
    })
  })
})

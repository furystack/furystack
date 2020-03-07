import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ErrorAction } from './error-action'
import '@furystack/logging'

describe('ErrorAction tests', () => {
  it('returns the error in the standard format', async () => {
    await usingAsync(new Injector().useLogging(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setExplicitInstance({ message: 'Something went wrong', stack: 'Stack' }, Error)
      const result = await ErrorAction({ injector: i, query: undefined, body: undefined })
      expect(result.statusCode).toBe(500)
      expect(result.chunk).toBe(
        '{"chunk":{"message":"Something went wrong","url":"https://google.com","stack":"Stack"}}',
      )
    })
  })
})

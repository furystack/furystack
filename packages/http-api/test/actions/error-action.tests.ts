import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { ErrorAction } from '../../src'

describe('ErrorAction tests', () => {
  it('returns the error in the standard format', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setExplicitInstance({ message: 'Something went wrong', stack: 'Stack' }, Error)
      const result = await ErrorAction(i)
      expect(result.statusCode).toBe(500)
      expect(result.chunk).toBe(
        '{"chunk":{"message":"Something went wrong","url":"https://google.com","stack":"Stack"}}',
      )
    })
  })
})

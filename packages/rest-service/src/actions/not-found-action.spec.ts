import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { NotFoundAction } from './not-found-action'

describe('NotFoundAction tests', () => {
  it('exec', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      const result = await NotFoundAction({ injector: i, query: undefined, body: undefined })
      expect(result.statusCode).toBe(404)
      expect(result.chunk).toBe(JSON.stringify({ Error: 'Content not found', url: 'https://google.com' }))
    })
  })
})

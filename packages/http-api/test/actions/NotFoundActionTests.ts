import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { NotFoundAction } from '../../src'

describe('NotFoundAction tests', () => {
  it('exec', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      const result = await NotFoundAction(i)
      expect(result.statusCode).toBe(404)
      expect(result.chunk).toBe(JSON.stringify({ Error: 'Content not found', url: 'https://google.com' }))
    })
  })
})

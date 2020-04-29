import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { NotFoundAction } from './not-found-action'
import { IncomingMessage, ServerResponse } from 'http'

describe('NotFoundAction tests', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('exec', async () => {
    await usingAsync(new Injector(), async (i) => {
      const result = await NotFoundAction({ injector: i, request, response })
      expect(result.statusCode).toBe(404)
      expect(result.chunk).toEqual({ error: 'Content not found' })
    })
  })
})

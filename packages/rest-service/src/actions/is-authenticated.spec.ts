import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { IsAuthenticated } from './is-authenticated'
import { HttpUserContext } from '../http-user-context'

describe('isAuthenticated', () => {
  it('exec', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ isAuthenticated: async () => true }, HttpUserContext)
      const result = await IsAuthenticated({ injector: i, body: undefined, query: undefined })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(JSON.stringify({ isAuthenticated: true }))
    })
  })
})

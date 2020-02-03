import { HttpUserContext, IsAuthenticated } from '../../src'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'

describe('isAuthenticated', () => {
  it('exec', async () => {
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ isAuthenticated: async () => true }, HttpUserContext)
      const result = await IsAuthenticated(i)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(JSON.stringify({ isAuthenticated: true }))
    })
  })
})

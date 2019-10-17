import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext, GetCurrentUser } from '../../src'

describe('getCurrentUser', () => {
  it('exec', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ getCurrentUser: async () => testUser }, HttpUserContext)
      const result = await GetCurrentUser(i)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(JSON.stringify(testUser))
    })
  })
})

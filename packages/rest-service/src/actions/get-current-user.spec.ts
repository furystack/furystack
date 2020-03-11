import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { GetCurrentUser } from './get-current-user'
import { HttpUserContext } from '../http-user-context'

describe('getCurrentUser', () => {
  it('exec', async () => {
    const testUser = { Name: 'Userke' }
    await usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ getCurrentUser: async () => testUser }, HttpUserContext)
      const result = await GetCurrentUser({ injector: i })
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toEqual(testUser)
    })
  })
})

import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from '@furystack/rest-service'
import { GoogleLoginAction, GoogleLoginService } from '.'
import { ServerResponse } from 'http'

describe('GoogleLoginAction', () => {
  it('Should be activated and disposed', async () => {
    await usingAsync(new Injector(), async i => {
      const testUser = { username: 'example', roles: [] }
      const cookieLogin = jest.fn(async () => testUser)
      i.setExplicitInstance({}, ServerResponse)

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = async () => testUser
      i.setExplicitInstance({ cookieLogin }, HttpUserContext)
      const result = await GoogleLoginAction({ injector: i, getBody: async () => ({ token: 'asd123' }) })
      expect(cookieLogin).toBeCalled()
      expect(result.chunk.username).toBe('example')
    })
  })
})

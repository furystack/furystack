import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from '@furystack/http-api'
import { GoogleLoginService } from './login-service'
import { GoogleLoginAction } from './login-action'

describe('GoogleLoginAction', () => {
  it('Should be activated and disposed', async () => {
    await usingAsync(new Injector(), async i => {
      const testUser = { username: 'example', roles: [] }
      const cookieLogin = jest.fn(async () => testUser)
      i.setExplicitInstance({}, ServerResponse)
      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = async () => testUser
      i.setExplicitInstance({ readPostBody: async () => ({ token: 'asd123' }) }, IncomingMessage)
      i.setExplicitInstance({ cookieLogin }, HttpUserContext)
      const result = await GoogleLoginAction(i)
      expect(cookieLogin).toBeCalled()
      expect(JSON.parse(result.chunk).user.username).toBe('example')
    })
  })
})

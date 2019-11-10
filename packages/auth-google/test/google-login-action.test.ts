import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from '@furystack/http-api'
import { GoogleLoginAction } from '../src'

describe('GoogleLoginAction', () => {
  it('Should be activated and disposed', async () => {
    await usingAsync(new Injector(), async i => {
      const externalLogin = jest.fn(async () => ({ username: 'example', roles: [] }))
      i.setExplicitInstance({}, ServerResponse)
      i.setExplicitInstance({ readPostBody: async () => ({ token: 'asd123' }) }, IncomingMessage)
      i.setExplicitInstance({ externalLogin }, HttpUserContext)
      const result = await GoogleLoginAction(i)
      expect(externalLogin).toBeCalled()
      expect(JSON.parse(result.chunk).user.username).toBe('example')
    })
  })
})

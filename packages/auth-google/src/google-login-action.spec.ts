import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from '@furystack/rest-service'
import { GoogleLoginAction } from './login-action.js'
import { ServerResponse } from 'http'
import type { IncomingMessage } from 'http'
import { describe, it, expect, vi } from 'vitest'
import { GoogleLoginService } from './login-service.js'

describe('GoogleLoginAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('Should be activated and disposed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const testUser = { username: 'example', roles: [] }
      const cookieLogin = vi.fn(() => Promise.resolve(testUser))
      i.setExplicitInstance({}, ServerResponse)

      i.setExplicitInstance(i.getInstance(GoogleLoginService))
      i.getInstance(GoogleLoginService).login = () => Promise.resolve(testUser)
      i.setExplicitInstance({ cookieLogin }, HttpUserContext)
      const result = await GoogleLoginAction({
        request,
        response,
        injector: i,
        getBody: () => Promise.resolve({ token: 'asd123' }),
      })
      expect(cookieLogin).toBeCalled()
      expect(result.chunk.username).toBe('example')
    })
  })
})

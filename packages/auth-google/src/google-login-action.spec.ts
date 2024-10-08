import { Injector } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage, ServerResponse } from 'http'
import { describe, expect, it, vi } from 'vitest'
import { GoogleLoginAction } from './login-action.js'
import { GoogleLoginService } from './login-service.js'

describe('GoogleLoginAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('Should be activated and disposed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const testUser = { username: 'example', roles: [] }
      const cookieLogin = vi.fn(() => Promise.resolve(testUser))

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

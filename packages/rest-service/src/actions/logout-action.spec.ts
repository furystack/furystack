import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { HttpUserContext } from '../http-user-context'
import { LogoutAction } from './logout'
import type { IncomingMessage, ServerResponse } from 'http'

describe('LogoutAction', () => {
  const request = { url: 'https://google.com' } as IncomingMessage
  const response = {} as ServerResponse

  it('exec', async () => {
    await usingAsync(new Injector(), async (i) => {
      const cookieLogout = jest.fn(async () => true)
      i.setExplicitInstance(
        {
          cookieLogout,
        },
        HttpUserContext,
      )

      const result = await LogoutAction({ request, response, injector: i } as any)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(cookieLogout).toBeCalled()
    })
  })
})

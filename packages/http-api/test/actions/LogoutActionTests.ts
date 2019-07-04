import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext } from '../../src'
import { LogoutAction } from '../../src/Actions/Logout'

describe('LogoutAction', () => {
  it('exec', async () => {
    await usingAsync(new Injector(), async i => {
      const cookieLogout = jest.fn(async () => true)
      i.setExplicitInstance(
        {
          cookieLogout,
        },
        HttpUserContext,
      )

      const result = await LogoutAction(i)
      expect(result.statusCode).toBe(200)
      expect(result.chunk).toBe(undefined)
      expect(cookieLogout).toBeCalled()
    })
  })
})

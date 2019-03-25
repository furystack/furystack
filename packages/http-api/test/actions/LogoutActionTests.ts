import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext } from '../../src'
import { LogoutAction } from '../../src/Actions/Logout'

describe('LogoutAction', () => {
  it('exec', done => {
    let cookieLogoutCalled = false
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance(
        {
          cookieLogout: async () => {
            cookieLogoutCalled = true
          },
        },
        HttpUserContext,
      )
      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance(
        {
          writeHead: () => undefined,
          // tslint:disable-next-line: no-unnecessary-type-annotation
          end: (result: string) => {
            expect(result).toEqual(JSON.stringify({ success: true }))
            expect(cookieLogoutCalled).toEqual(true)
            done()
          },
        },
        ServerResponse,
      )
      await usingAsync(i.getInstance(LogoutAction), async c => {
        await c.exec()
      })
    })
  })
})

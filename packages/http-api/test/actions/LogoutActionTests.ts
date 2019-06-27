import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext } from '../../src'
import { LogoutAction } from '../../src/Actions/Logout'
import { SendJsonOptions } from '../../src/ServerResponseExtensiont'

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
          sendJson: (options: SendJsonOptions<any>) => {
            expect(options.json).toEqual({ success: true })
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

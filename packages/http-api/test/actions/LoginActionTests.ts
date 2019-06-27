import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext } from '../../src'
import { LoginAction } from '../../src/Actions/Login'
import { SendJsonOptions } from '../../src/ServerResponseExtensiont'
describe('LoginAction', () => {
  /** */
  it('exec', done => {
    const testUser = { Name: 'Userke' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ cookieLogin: async () => testUser }, HttpUserContext)
      i.setExplicitInstance({ readPostBody: async () => ({}) }, IncomingMessage)
      i.setExplicitInstance(
        {
          sendJson: (options: SendJsonOptions<any>) => {
            expect(options.json).toEqual(testUser)
            done()
          },
        },
        ServerResponse,
      )
      await usingAsync(i.getInstance(LoginAction), async c => {
        await c.exec()
      })
    })
  })
})

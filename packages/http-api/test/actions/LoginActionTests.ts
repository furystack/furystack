import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { HttpUserContext, Utils } from '../../src'
import { LoginAction } from '../../src/Actions/Login'
describe('LoginAction', () => {
  /** */
  it('exec', done => {
    const testUser = { Name: 'Userke' }
    usingAsync(new Injector({ parent: undefined }), async i => {
      i.setInstance({ cookieLogin: async () => testUser }, HttpUserContext)
      i.setInstance({}, IncomingMessage)
      i.setInstance({ readPostBody: async () => ({}) }, Utils)
      i.setInstance(
        {
          writeHead: () => undefined,
          // tslint:disable-next-line: no-unnecessary-type-annotation
          end: (result: string) => {
            expect(result).toEqual(JSON.stringify(testUser))
            done()
          },
        },
        ServerResponse,
      )
      await usingAsync(i.getInstance(LoginAction, true), async c => {
        await c.exec()
      })
    })
  })
})

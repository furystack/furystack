import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext } from '../../src'
import { LoginAction } from '../../src/Actions/Login'
describe('LoginAction', () => {
  /** */
  it('exec', done => {
    const testUser = { Name: 'Userke' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ cookieLogin: async () => testUser }, HttpUserContext)
      i.setExplicitInstance(
        // tslint:disable-next-line: no-unnecessary-type-annotation
        { on: (name: string, callback: () => void) => callback(), read: () => '{}' },
        IncomingMessage,
      )
      i.setExplicitInstance(
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
      await usingAsync(i.getInstance(LoginAction), async c => {
        await c.exec()
      })
    })
  })
})

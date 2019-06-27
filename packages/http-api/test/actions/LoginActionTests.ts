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
      i.setExplicitInstance({ cookieLogin: async () => testUser, authentication: { visitorUser: {} } }, HttpUserContext)
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

  it('exec', done => {
    const visitorUser = { Name: 'Visitorka' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ cookieLogin: async () => visitorUser, authentication: { visitorUser } }, HttpUserContext)
      i.setExplicitInstance({ readPostBody: async () => ({}) }, IncomingMessage)
      i.setExplicitInstance(
        {
          sendJson: (options: SendJsonOptions<any>) => {
            expect(options.statusCode).toBe(400)
            expect(options.json).toEqual({ message: 'Login failed' })
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

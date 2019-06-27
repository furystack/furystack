import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { HttpUserContext } from '../../src'
import { GetCurrentUser } from '../../src/Actions/GetCurrentUser'
import { SendJsonOptions } from '../../src/ServerResponseExtensiont'

describe('getCurrentUser', () => {
  it('exec', done => {
    const testUser = { Name: 'Userke' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance(
        {
          // tslint:disable-next-line: no-unnecessary-type-annotation
          sendJson: (options: SendJsonOptions<any>) => {
            expect(options.json).toEqual(testUser)
            done()
          },
        },
        ServerResponse,
      )
      i.setExplicitInstance({ getCurrentUser: async () => testUser }, HttpUserContext)
      await usingAsync(i.getInstance(GetCurrentUser), async c => {
        await c.exec()
      })
    })
  })
})

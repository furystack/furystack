import { UserContext } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { ServerResponse } from 'http'
import { GetCurrentUser } from '../../src/Actions/GetCurrentUser'

describe('getCurrentUser', () => {
  it('exec', done => {
    const testUser = { Name: 'Userke' }
    usingAsync(new Injector({ parent: undefined }), async i => {
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
      i.setInstance({ getCurrentUser: async () => testUser }, UserContext)
      await usingAsync(i.getInstance(GetCurrentUser, true), async c => {
        await c.exec()
      })
    })
  })
})

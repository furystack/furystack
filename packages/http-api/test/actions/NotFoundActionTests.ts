import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { NotFoundAction } from '../../src'

describe('NotFoundAction tests', () => {
  it('exec', done => {
    const notFoundResponse = { Error: 'Content not found', url: 'https://google.com' }
    usingAsync(new Injector({ parent: undefined }), async i => {
      i.setInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setInstance(
        {
          writeHead: () => undefined,
          // tslint:disable-next-line: no-unnecessary-type-annotation
          end: (result: string) => {
            expect(result).toEqual(JSON.stringify(notFoundResponse))
            done()
          },
        },
        ServerResponse,
      )
      await usingAsync(i.getInstance(NotFoundAction, true), async c => {
        await c.exec()
      })
    })
  })
})

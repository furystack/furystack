import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { NotFoundAction } from '../../src'

describe('NotFoundAction tests', () => {
  it('exec', done => {
    const notFoundResponse = { Error: 'Content not found', url: 'https://google.com' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({ url: 'https://google.com' }, IncomingMessage)
      i.setExplicitInstance(
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
      await usingAsync(i.getInstance(NotFoundAction), async c => {
        await c.exec()
      })
    })
  })
})

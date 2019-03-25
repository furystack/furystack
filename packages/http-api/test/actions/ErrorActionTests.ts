import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { ErrorAction } from '../../src'

describe('ErrorAction tests', () => {
  it('exec', done => {
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance({}, ServerResponse)
      await usingAsync(i.getInstance(ErrorAction), async e => {
        try {
          await e.exec()
          done('Should throw')
        } catch (error) {
          done()
        }
      })
    })
  })

  it('returnError', done => {
    const testError = { message: ':(' }
    usingAsync(new Injector(), async i => {
      i.setExplicitInstance({}, IncomingMessage)
      i.setExplicitInstance(
        {
          writeHead: () => undefined,
          // tslint:disable-next-line: no-unnecessary-type-annotation
          end: (result: string) => {
            expect(result).toEqual(JSON.stringify(testError))
            done()
          },
        },
        ServerResponse,
      )
      await usingAsync(i.getInstance(ErrorAction), async c => {
        c.returnError(testError)
      })
    })
  })
})

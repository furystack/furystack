import { IncomingMessage, ServerResponse } from 'http'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { ErrorAction } from '../../src'
import { SendJsonOptions } from '../../src/ServerResponseExtensiont'

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
          // tslint:disable-next-line: no-unnecessary-type-annotation
          sendJson: (options: SendJsonOptions<any>) => {
            expect(options.json).toEqual(testError)
            expect(options.statusCode).toBe(500)
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

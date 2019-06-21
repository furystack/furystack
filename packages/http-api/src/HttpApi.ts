import { IncomingMessage, ServerResponse } from 'http'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { LoggerCollection, ScopedLogger } from '@furystack/logging'
import { usingAsync } from '@sensenet/client-utils'
import { HttpApiSettings } from './HttpApiSettings'
import { RequestAction } from './Models'
import { Utils } from './Utils'

/**
 * HTTP Rest API implementation for FuryStack
 */
@Injectable({ lifetime: 'singleton' })
export class HttpApi {
  public async mainRequestListener(incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
    await usingAsync(this.injector.createChild({ owner: IncomingMessage }), async injector => {
      injector.setExplicitInstance(incomingMessage, IncomingMessage)
      injector.setExplicitInstance(serverResponse, ServerResponse)
      injector.getInstance(Utils).addCorsHeaders(this.settings.corsOptions, incomingMessage, serverResponse)
      const actionCtors = this.settings.actions
        .map(a => a(incomingMessage, injector))
        .filter(a => a !== undefined) as Array<Constructable<RequestAction>>
      if (actionCtors.length > 1) {
        this.logger.error({
          message: `Multiple HTTP actions found that can be execute the request`,
          data: {
            incomingMessage,
          },
        })
        throw Error(`Multiple HTTP actions found that can be execute the request`)
      }
      if (actionCtors.length === 1) {
        try {
          const actionCtor = actionCtors[0]
          await usingAsync(injector.getInstance(actionCtor), async action => {
            await action.exec()
          })
        } catch (error) {
          await usingAsync(injector.getInstance(this.settings.errorAction), async e => {
            await e.returnError(error)
          })
        }
      } else {
        await usingAsync(injector.getInstance(this.settings.notFoundAction), async a => {
          a.exec()
        })
      }
    })
  }

  private readonly logger: ScopedLogger

  private readonly injector: Injector
  constructor(parentInjector: Injector, logger: LoggerCollection, private readonly settings: HttpApiSettings) {
    this.injector = parentInjector.createChild({ owner: this })
    this.logger = logger.withScope(`@furystack/http-api/${this.constructor.name}`)
  }
}

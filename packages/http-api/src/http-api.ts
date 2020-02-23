import { IncomingMessage, ServerResponse } from 'http'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { usingAsync } from '@furystack/utils'
import { HttpApiSettings } from './http-api-settings'
import { Utils } from './utils'
import { RequestAction } from './models/request-action'
import './injector-extensions'

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

      if (incomingMessage.method === 'OPTIONS') {
        serverResponse.writeHead(200)
        serverResponse.end()
        return
      }

      const actionMethods = this.settings.actions.map(a => a(injector)).filter(a => a !== undefined)
      if (actionMethods.length > 1) {
        this.logger.error({
          message: `Multiple HTTP actions found that can be execute the request`,
          data: {
            incomingMessage,
          },
        })
        throw Error(`Multiple HTTP actions found that can be execute the request`)
      }
      if (actionMethods.length === 1) {
        try {
          const result = await (actionMethods[0] as RequestAction)(injector)
          serverResponse.sendActionResult(result)
        } catch (error) {
          injector.setExplicitInstance(error, Error)
          const errorResult = await this.settings.errorAction(injector)
          serverResponse.sendActionResult(errorResult)
        }
      } else {
        const notFoundResult = await this.settings.notFoundAction(injector)
        serverResponse.sendActionResult(notFoundResult)
      }
    })
  }

  private readonly logger: ScopedLogger
  private readonly settings: HttpApiSettings

  private readonly injector: Injector
  constructor(parentInjector: Injector) {
    this.injector = parentInjector.createChild({ owner: this })
    this.settings = this.injector.getInstance(HttpApiSettings)
    this.logger = this.injector.logger.withScope(`@furystack/http-api/${this.constructor.name}`)
  }
}

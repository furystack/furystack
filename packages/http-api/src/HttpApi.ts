import { IApi, LoggerCollection } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'net'
import { HttpApiSettings } from './HttpApiSettings'
import { IRequestAction } from './Models'
import { Utils } from './Utils'

/**
 * HTTP Rest API implementation for FuryStack
 */
@Injectable()
export class HttpApi implements IApi {
  public readonly logScope = '@furystack/http-api/HttpApi'

  public async mainRequestListener(incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
    await this.awaitActivation
    await usingAsync(this.injector.createChild({ owner: IncomingMessage }), async injector => {
      injector.setExplicitInstance(incomingMessage)
      injector.setExplicitInstance(serverResponse)
      injector.getInstance(Utils, true).addCorsHeaders(this.settings.corsOptions, incomingMessage, serverResponse)

      /** ToDo: Check this */

      const actionCtors = this.settings.actions.map(a => a(incomingMessage)).filter(a => a !== undefined) as Array<
        Constructable<IRequestAction>
      >
      if (actionCtors.length > 1) {
        this.logger.error({
          scope: this.logScope,
          message: `Multiple HTTP actions found that can be execute the request`,
          data: {
            incomingMessage,
          },
        })
        throw Error(`Multiple HTTP actions found that can be execute the request`)
      }
      if (actionCtors.length === 1) {
        try {
          this.settings.perRequestServices.map(s => {
            const created = injector.getInstance(s.value, true)
            injector.setExplicitInstance(created, s.key)
            return created
          })
          const actionCtor = actionCtors[0]
          await usingAsync(injector.getInstance(actionCtor, true), async action => {
            await action.exec()
          })
        } catch (error) {
          await usingAsync(injector.getInstance(this.settings.errorAction, true), async e => {
            await e.returnError(error)
          })
        }
      } else {
        await usingAsync(injector.getInstance(this.settings.notFoundAction, true), async a => {
          a.exec()
        })
      }
    })
  }

  public async activate() {
    this.server = this.settings.serverFactory(this.mainRequestListener.bind(this))
    this.server.listen(this.settings.port, this.settings.hostName, 8192)
  }

  public awaitActivation: Promise<void>
  public async dispose() {
    if (this.server !== undefined) {
      await new Promise(resolve => {
        ;(this.server as Server).on('close', () => resolve())
        ;(this.server as Server).close()
      })
    }
  }

  public server?: Server
  private readonly injector: Injector
  constructor(
    parentInjector: Injector,
    private readonly logger: LoggerCollection,
    private readonly settings: HttpApiSettings,
  ) {
    this.injector = parentInjector.createChild({ owner: this })
    this.awaitActivation = this.activate()
  }
}

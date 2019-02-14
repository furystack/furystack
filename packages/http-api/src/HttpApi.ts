import { IApi, LoggerCollection } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage, ServerResponse } from 'http'
import { Server } from 'net'
import { HttpApiConfiguration } from './HttpApiConfiguration'
import { IRequestAction } from './Models'
import { Utils } from './Utils'

/**
 * HTTP Rest API implementation for FuryStack
 */
@Injectable()
export class HttpApi implements IApi {
  public readonly logScope = '@furystack/http-api/HttpApi'

  public async mainRequestListener(incomingMessage: IncomingMessage, serverResponse: ServerResponse) {
    await usingAsync(new Injector({ parent: this.injector, owner: IncomingMessage }), async injector => {
      injector.setInstance(incomingMessage)
      injector.setInstance(serverResponse)
      injector.setInstance(new Utils(incomingMessage, serverResponse))
      injector.getInstance(Utils).addCorsHeaders(this.options.corsOptions, incomingMessage, serverResponse)
      const actionCtors = this.options.actions.map(a => a(incomingMessage)).filter(a => a !== undefined) as Array<
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
          this.options.perRequestServices.map(s => {
            const created = injector.getInstance(s.value, true)
            injector.setInstance(created, s.key)
            return created
          })
          const actionCtor = actionCtors[0]
          await usingAsync(injector.getInstance(actionCtor, true), async action => {
            await action.exec()
          })
        } catch (error) {
          await usingAsync(injector.getInstance(this.options.errorAction, true), async e => {
            await e.returnError(error)
          })
        }
      } else {
        await usingAsync(injector.getInstance(this.options.notFoundAction, true), async a => {
          a.exec()
        })
      }
    })
  }

  public async activate() {
    this.server = this.options.serverFactory(this.mainRequestListener.bind(this))
    this.server.listen(this.options.port, this.options.hostName, 8192)
  }
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
    private readonly options: HttpApiConfiguration,
  ) {
    this.injector = new Injector({ parent: parentInjector })
  }
}

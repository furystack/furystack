import { ServerResponse, IncomingMessage } from 'http'
import { Constructable, Injector } from '@furystack/inject'
import { sleepAsync } from '@sensenet/client-utils'
import { RequestAction } from '../Models/RequestAction'
import { HttpUserContext } from '../HttpUserContext'
import '@furystack/logging/dist/InjectorExtension'

export const Authenticate = () => <T extends Constructable<RequestAction & { injector: Injector }>>(constructor: T) => {
  return class extends constructor {
    public async exec(): Promise<void> {
      const userContext = this.injector.getInstance(HttpUserContext)
      const authenticated = await userContext.isAuthenticated()

      if (!authenticated) {
        await sleepAsync(Math.random() * 1000)
        const response = this.injector.getInstance(ServerResponse)
        const request = this.injector.getInstance(IncomingMessage)
        response.writeHead(401, 'Unauthorized', {
          'WWW-Authenticate': 'Basic',
        })
        response.end()
        this.injector.logger.warning({
          scope: '@furystack/http-api/@Authenticate()',
          message: `A Visitor user has been tried to access to action '${request.url}' without authentication.`,
          data: {
            url: request.url,
          },
        })
        return
      }
      return await super.exec()
    }
  }
}

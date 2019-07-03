import { IncomingMessage, ServerResponse } from 'http'
import { Injector, Constructable } from '@furystack/inject'
import { sleepAsync } from '@sensenet/client-utils'
import { RequestAction } from '../Models/RequestAction'
import { HttpUserContext } from '../HttpUserContext'

export const Authorize = (...roles: string[]) => <T extends Constructable<RequestAction & { injector: Injector }>>(
  constructor: T,
) => {
  return class extends constructor {
    public async exec(): Promise<void> {
      const userContext = this.injector.getInstance(HttpUserContext)
      const currentUser = await userContext.getCurrentUser()

      const authorized = await userContext.isAuthorized(...roles)
      if (!authorized) {
        await sleepAsync(Math.random() * 1000)
        const response = this.injector.getInstance(ServerResponse)
        const request = this.injector.getInstance(IncomingMessage)
        response.writeHead(403, 'Forbidden')
        response.end()
        this.injector.logger.warning({
          scope: '@furystack/http-api/@Authorize()',
          message: `User '${currentUser.username}' has been tried to access to action '${request.url}' without the required roles.`,
          data: {
            user: currentUser,
            requiredRoles: roles,
          },
        })
        return
      }
      return await super.exec()
    }
  }
}

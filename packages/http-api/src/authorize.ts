import '@furystack/logging'
import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction } from './models/request-action'
import { HttpUserContext } from './http-user-context'

export const Authorize = (...roles: string[]) => (action: RequestAction) => {
  return async (i: Injector) => {
    const userContext = i.getInstance(HttpUserContext)
    try {
      const currentUser = await userContext.getCurrentUser()
      const authorized = await userContext.isAuthorized(...roles)
      if (!authorized) {
        const { url } = i.getInstance(IncomingMessage)
        await sleepAsync(Math.random() * 1000)
        i.logger.warning({
          scope: '@furystack/http-api/@Authorize()',
          message: `User '${currentUser.username}' has been tried to access to action '${url}' without the required roles.`,
          data: {
            user: currentUser,
            requiredRoles: roles,
          },
        })
        return JsonResult({ error: 'forbidden' }, 403)
      }
      return await action(i)
    } catch (error) {
      return JsonResult({ error: 'forbidden' }, 403)
    }
  }
}

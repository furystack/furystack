import '@furystack/logging'
import { IncomingMessage } from 'http'
import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction, RequestOptions, RequestActionOptions } from '@furystack/rest'
import { HttpUserContext } from './http-user-context'

export const Authorize = <T extends RequestActionOptions>(...roles: string[]) => (action: RequestAction<T>) => {
  return async (options: RequestOptions<T['query'], T['body'], T['urlParams']>) => {
    const userContext = options.injector.getInstance(HttpUserContext)
    try {
      const currentUser = await userContext.getCurrentUser()
      const authorized = await userContext.isAuthorized(...roles)
      if (!authorized) {
        const { url } = options.injector.getInstance(IncomingMessage)
        await sleepAsync(Math.random() * 1000)
        options.injector.logger.warning({
          scope: '@furystack/rest-service/@Authorize()',
          message: `User '${currentUser.username}' has been tried to access to action '${url}' without the required roles.`,
          data: {
            user: currentUser,
            requiredRoles: roles,
          },
        })
        return JsonResult({ error: 'forbidden' }, 403)
      }
      return await action(options)
    } catch (error) {
      return JsonResult({ error: 'forbidden' }, 403)
    }
  }
}

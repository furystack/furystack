import '@furystack/logging'
import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction, RequestOptions, RequestActionOptions, ActionResult } from '@furystack/rest'
import { HttpUserContext } from './http-user-context'

export const Authorize = (...roles: string[]) => <T extends RequestActionOptions>(
  action: RequestAction<T>,
): RequestAction<T> => {
  return async (options: RequestOptions<T['query'], T['body'], T['urlParams']>): Promise<ActionResult<T>> => {
    try {
      const userContext = options.injector.getInstance(HttpUserContext)
      const currentUser = await userContext.getCurrentUser()
      const authorized = await userContext.isAuthorized(...roles)
      if (!authorized) {
        const { url } = options.request
        await sleepAsync(Math.random() * 1000)
        options.injector.logger.warning({
          scope: '@furystack/rest-service/@Authorize()',
          message: `User '${currentUser.username}' has been tried to access to action '${url}' without the required roles.`,
          data: {
            user: currentUser,
            requiredRoles: roles,
          },
        })
        return JsonResult({ error: 'forbidden' }, 403) as any
      }
    } catch (error) {
      return JsonResult({ error: 'forbidden' }, 403) as any
    }
    return await action(options)
  }
}

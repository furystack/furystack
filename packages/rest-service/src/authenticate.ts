import { isAuthenticated } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import { HttpUserContext } from './http-user-context'
import { ActionResult, JsonResult, RequestAction, RequestActionOptions } from './request-action-implementation'

export const Authenticate =
  () =>
  <T extends { result: unknown }>(action: RequestAction<T>): RequestAction<T> => {
    return async (args: RequestActionOptions<T>): Promise<ActionResult<T>> => {
      const { injector } = args
      const authenticated = await isAuthenticated(injector)
      if (!authenticated) {
        await sleepAsync(Math.random() * 1000)
        return JsonResult(
          { error: 'unauthorized' },
          401,
          injector.getInstance(HttpUserContext).authentication.enableBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {},
        ) as unknown as ActionResult<T>
      }
      return (await action(args)) as any
    }
  }

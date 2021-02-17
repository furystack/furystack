import { sleepAsync } from '@furystack/utils'
import { ActionResult, JsonResult, RequestAction, RequestActionOptions } from './request-action-implementation'

export const Authorize = (...roles: string[]) => <T extends { result: unknown }>(
  action: RequestAction<T>,
): RequestAction<T> => {
  return async (options: RequestActionOptions<T>): Promise<ActionResult<T>> => {
    try {
      const authorized = await options.injector.isAuthorized(...roles)
      if (!authorized) {
        await sleepAsync(Math.random() * 1000)
        return JsonResult({ error: 'forbidden' }, 403) as any
      }
    } catch (error) {
      return JsonResult({ error: 'forbidden' }, 403) as any
    }
    return (await action(options)) as any
  }
}

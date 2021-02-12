import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction, RequestOptions, RequestActionOptions, ActionResult } from '@furystack/rest'

export const Authorize = (...roles: string[]) => <T extends RequestActionOptions>(
  action: RequestAction<T>,
): RequestAction<T> => {
  return async (
    options: RequestOptions<T['query'], T['body'], T['urlParams'], T['headers']>,
  ): Promise<ActionResult<T>> => {
    try {
      const authorized = await options.injector.isAuthorized(...roles)
      if (!authorized) {
        await sleepAsync(Math.random() * 1000)
        return JsonResult({ error: 'forbidden' }, 403) as any
      }
    } catch (error) {
      return JsonResult({ error: 'forbidden' }, 403) as any
    }
    return await action(options)
  }
}

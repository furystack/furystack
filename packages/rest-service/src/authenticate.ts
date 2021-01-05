import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction, RequestOptions, ActionResult, RequestActionOptions } from '@furystack/rest'
import { HttpUserContext } from './http-user-context'

export const Authenticate = () => <T extends RequestActionOptions>(action: RequestAction<T>): RequestAction<T> => {
  return async (args: RequestOptions<T['query'], T['body'], T['urlParams']>): Promise<ActionResult<T>> => {
    const authenticated = await args.injector.isAuthenticated()
    if (!authenticated) {
      await sleepAsync(Math.random() * 1000)
      return (JsonResult(
        { error: 'unauthorized' },
        401,
        args.injector.getInstance(HttpUserContext).authentication.enableBasicAuth
          ? { 'WWW-Authenticate': 'Basic' }
          : {},
      ) as unknown) as ActionResult<T>
    }
    return await action(args)
  }
}

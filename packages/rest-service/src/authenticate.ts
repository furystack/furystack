import '@furystack/logging'
import { IncomingMessage } from 'http'
import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction, RequestOptions, ActionResult, RequestActionOptions } from '@furystack/rest'
import { HttpUserContext } from './http-user-context'

export const Authenticate = () => <T extends RequestActionOptions>(action: RequestAction<T>): RequestAction<T> => {
  return async (args: RequestOptions<T['query'], T['body'], T['urlParams']>): Promise<ActionResult<T>> => {
    const userContext = args.injector.getInstance(HttpUserContext)
    const authenticated = await userContext.isAuthenticated()
    if (!authenticated) {
      const { url } = args.injector.getInstance(IncomingMessage)
      await sleepAsync(Math.random() * 1000)
      args.injector.logger.warning({
        scope: '@furystack/rest-service/@Authenticate()',
        message: `An unauthenticated user has been tried to access to action '${url}' without authentication.`,
        data: {
          url,
        },
      })
      return (JsonResult(
        { error: 'unauthorized' },
        401,
        userContext.authentication.enableBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {},
      ) as unknown) as ActionResult<T>
    }
    return await action(args)
  }
}

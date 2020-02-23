import '@furystack/logging'
import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'
import { JsonResult, RequestAction } from './models/request-action'
import { HttpUserContext } from './http-user-context'

export const Authenticate = () => (action: RequestAction) => {
  return async (i: Injector) => {
    const userContext = i.getInstance(HttpUserContext)
    const authenticated = await userContext.isAuthenticated()
    if (!authenticated) {
      const { url } = i.getInstance(IncomingMessage)
      await sleepAsync(Math.random() * 1000)
      i.logger.warning({
        scope: '@furystack/http-api/@Authenticate()',
        message: `An unauthenticated user has been tried to access to action '${url}' without authentication.`,
        data: {
          url,
        },
      })
      return JsonResult(
        { error: 'unauthorized' },
        401,
        userContext.authentication.enableBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {},
      )
    }
    return await action(i)
  }
}

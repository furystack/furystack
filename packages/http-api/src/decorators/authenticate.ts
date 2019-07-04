import '@furystack/logging/dist/InjectorExtension'
import { IncomingMessage } from 'http'
import { Injector } from '@furystack/inject'
import { sleepAsync } from '@sensenet/client-utils'
import { ActionResult, JsonResult } from '../Models'
import { HttpUserContext } from '../HttpUserContext'

export const Authenticate = <T extends (i: Injector) => Promise<ActionResult<any>>>(
  promptBasicAuth: boolean = false,
) => (_target: any, _property: string, descriptor: TypedPropertyDescriptor<T>) => {
  const implementation = descriptor.value
  return {
    ...descriptor,
    value: async (i: Injector) => {
      const userContext = i.getInstance(HttpUserContext)
      const authenticated = await userContext.isAuthenticated()
      if (!authenticated) {
        const { url } = i.getInstance(IncomingMessage)
        await sleepAsync(Math.random() * 1000)
        i.logger.warning({
          scope: '@furystack/http-api/@Authenticate()',
          message: `A Visitor user has been tried to access to action '${url}' without authentication.`,
          data: {
            url,
          },
        })
        return JsonResult({ error: 'unauthorized' }, 401, promptBasicAuth ? { 'WWW-Authenticate': 'Basic' } : {})
      }
      return implementation && (await implementation(i))
    },
  }
}

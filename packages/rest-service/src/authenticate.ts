import { sleepAsync } from '@furystack/utils'
import { HttpUserContext } from './http-user-context'
import {
  ActionResult,
  JsonResult,
  RequestActionImplementation,
  RequestActionImplementationOptions,
} from './request-action-implementation'

export const Authenticate = () => <T extends { result: unknown }>(
  action: RequestActionImplementation<T>,
): RequestActionImplementation<T> => {
  return async (args: RequestActionImplementationOptions<T>): Promise<ActionResult<T>> => {
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
    return (await action(args)) as any
  }
}

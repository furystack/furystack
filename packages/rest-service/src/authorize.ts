import { AuthorizationError, isAuthorized } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import type { ActionResult, RequestAction, RequestActionOptions } from './request-action-implementation.js'

export const Authorize =
  (...roles: string[]) =>
  <T extends { result: unknown }>(action: RequestAction<T>): RequestAction<T> => {
    return async (options: RequestActionOptions<T>): Promise<ActionResult<T>> => {
      try {
        const authorized = await isAuthorized(options.injector, ...roles)
        if (!authorized) {
          await sleepAsync(Math.random() * 1000)
          throw new AuthorizationError('forbidden')
        }
      } catch (error) {
        throw new AuthorizationError('forbidden')
      }
      return (await action(options)) as ActionResult<T>
    }
  }

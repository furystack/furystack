import { HttpUserContext } from '../http-user-context'
import { EmptyResult, RequestActionImplementation } from '../request-action-implementation'

/**
 * Action that logs out the current user
 *
 * @param root0 The Options object
 * @param root0.injector The injector from the context
 * @param root0.request The current Request object
 * @param root0.response The Response object
 * @returns An empty result that indicates the success
 */
export const LogoutAction: RequestActionImplementation<{ result: unknown }> = async ({
  injector,
  request,
  response,
}) => {
  await injector.getInstance(HttpUserContext).cookieLogout(request, response)
  return EmptyResult()
}

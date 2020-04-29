import { HttpUserContext } from '../http-user-context'
import { RequestAction, EmptyResult } from '@furystack/rest'

/**
 * Action that logs out the current user
 *
 * @param injector The injector from the current stack
 */
export const LogoutAction: RequestAction<{}> = async ({ injector, request, response }) => {
  await injector.getInstance(HttpUserContext).cookieLogout(request, response)
  return EmptyResult()
}

import { parse } from 'url'
import { RouteModel } from './models/route-model'
import { IsAuthenticated, GetCurrentUser, LoginAction, LogoutAction } from './actions'

/**
 * Default routes for /login, /logout and /getCurrentUser
 * @param msg The incoming HTTP Message
 */
export const defaultLoginRoutes: RouteModel = injector => {
  const msg = injector.getRequest()
  const urlPathName = parse(msg.url || '', true).pathname
  switch (urlPathName) {
    case '/isAuthenticated':
      return IsAuthenticated
    case '/currentUser':
      return GetCurrentUser
    case '/login':
      return LoginAction
    case '/logout':
      return LogoutAction
    default:
      return undefined
  }
}

import { parse } from 'url'
import { GetCurrentUser } from './Actions/GetCurrentUser'
import { LoginAction } from './Actions/Login'
import { LogoutAction } from './Actions/Logout'
import { RouteModel } from './Models'

/**
 * Default routes for /login, /logout and /getCurrentUser
 * @param msg The incoming HTTP Message
 */
export const defaultLoginRoutes: RouteModel = injector => {
  const msg = injector.getRequest()
  const urlPathName = parse(msg.url || '', true).pathname
  switch (urlPathName) {
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

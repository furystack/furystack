import { IncomingMessage } from 'http'
import { parse } from 'url'
import { Constructable } from '@furystack/inject'
import { GetCurrentUser } from './Actions/GetCurrentUser'
import { LoginAction } from './Actions/Login'
import { LogoutAction } from './Actions/Logout'
import { RequestAction } from './Models'

/**
 * Default routes for /login, /logout and /getCurrentUser
 * @param msg The incoming HTTP Message
 */
export const defaultLoginRoutes: (msg: IncomingMessage) => Constructable<RequestAction> | undefined = msg => {
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

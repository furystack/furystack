import { IncomingMessage } from 'http'
import { LoginAction, LogoutAction, GetCurrentUser } from '../src'
import { defaultLoginRoutes } from '../src/default-login-routes'

describe('Default login routes', () => {
  it('/login should resolve Login action', () => {
    expect(defaultLoginRoutes({ url: '/login' } as IncomingMessage)).toBe(LoginAction)
  })

  it('/logout should resolve Login action', () => {
    expect(defaultLoginRoutes({ url: '/logout' } as IncomingMessage)).toBe(LogoutAction)
  })

  it('/currentUser should resolve Login action', () => {
    expect(defaultLoginRoutes({ url: '/currentUser' } as IncomingMessage)).toBe(GetCurrentUser)
  })

  it('Other requests should return undefined', () => {
    expect(defaultLoginRoutes({ url: '/asdasdasd' } as IncomingMessage)).toBe(undefined)
  })
})

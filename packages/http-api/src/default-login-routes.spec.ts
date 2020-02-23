import { IncomingMessage } from 'http'
import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { GetCurrentUser, LoginAction, LogoutAction } from './actions'
import { defaultLoginRoutes } from './default-login-routes'

describe('Default login routes', () => {
  it('/login should resolve Login action', () => {
    using(new Injector(), i => {
      i.setExplicitInstance({ url: '/login' }, IncomingMessage)
      expect(defaultLoginRoutes(i)).toBe(LoginAction)
    })
  })

  it('/logout should resolve Login action', () => {
    using(new Injector(), i => {
      i.setExplicitInstance({ url: '/logout' }, IncomingMessage)
      expect(defaultLoginRoutes(i)).toBe(LogoutAction)
    })
  })

  it('/currentUser should resolve Login action', () => {
    using(new Injector(), i => {
      i.setExplicitInstance({ url: '/currentUser' }, IncomingMessage)
      expect(defaultLoginRoutes(i)).toBe(GetCurrentUser)
    })
  })

  it('Other requests should return undefined', () => {
    using(new Injector(), i => {
      i.setExplicitInstance({ url: '/asdasdasd' }, IncomingMessage)
      expect(defaultLoginRoutes(i)).toBe(undefined)
    })
  })
})

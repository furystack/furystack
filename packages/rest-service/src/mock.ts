import { Injector } from '@furystack/inject'
import { RestApi } from '@furystack/rest'
import { LoginAction, LogoutAction, IsAuthenticated, GetCurrentUser } from './actions'
import { ConsoleLogger } from '@furystack/logging'
import { InMemoryStore, User, StoreManager } from '@furystack/core'
import { DefaultSession } from './models/default-session'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { Authenticate } from './authenticate'

interface MyApi extends RestApi {
  GET: {
    '/isAuthenticated': typeof IsAuthenticated
    '/currentUser': typeof GetCurrentUser
  }
  POST: {
    '/login': typeof LoginAction
    '/logout': typeof LogoutAction
  }
}

console.log('Starting Mock...')

export const injector = new Injector()
  .useLogging(ConsoleLogger)

  .setupStores(sm =>
    sm
      .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
      .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
  )
  .useRestService<MyApi>({
    port: 9999,
    api: {
      GET: {
        '/isAuthenticated': IsAuthenticated,
        '/currentUser': Authenticate()(GetCurrentUser),
      },
      POST: {
        '/login': LoginAction,
        '/logout': LogoutAction,
      },
    },
  })
  .useHttpAuthentication({ enableBasicAuth: true })

const sm = injector.getInstance(StoreManager)
const auth = injector.getInstance(HttpAuthenticationSettings)
sm.getStoreFor(User).add({ username: 'testuser', password: auth.hashMethod('password') } as any)

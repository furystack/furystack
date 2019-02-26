import { GoogleLoginAction } from '@furystack/auth-google'
import { ConsoleLogger } from '@furystack/core'
import { StoreManager } from '@furystack/core/dist/StoreManager'
import { GetCurrentUser, HttpAuthenticationSettings, LoginAction, LogoutAction } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import '@furystack/typeorm-store'
import '@furystack/websocket-api'
import { join } from 'path'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'
import { User } from './Models/User'

const a = 1
console.log(a)

/**
 * Demo Application
 */
;(async () => {
  const defaultInjector = new Injector()

  defaultInjector
    .useLogging(ConsoleLogger, ConsoleLogger)
    .useTypeOrm({
      name: 'UserDb',
      type: 'sqlite',
      database: join(__dirname, 'users.sqlite'),
      logging: true,
      entities: [User],
      synchronize: true,
    })
    .setupStores(sm => sm.useTypeOrmStore(User, 'UserDb'))
    .useHttpApi({
      corsOptions: {
        credentials: true,
        origins: ['http://localhost:8080'],
      },
      actions: [
        msg => {
          const urlPathName = parse(msg.url || '', true).pathname
          switch (urlPathName) {
            case '/currentUser':
              return GetCurrentUser
            case '/login':
              return LoginAction
            case '/googleLogin':
              return GoogleLoginAction
            case '/logout':
              return LogoutAction
          }
          return undefined
        },
      ],
    })
    .listenHttp({ port: 80, hostName: 'localhost' })
    .listenHttps({ port: 8443, credentials: new CertificateManager().getCredentials(), hostName: 'localhost' })
    .useHttpAuthentication<User>({
      getUserStore: sm => sm.getStoreFor(User),
    })
    .useWebsockets()
  ;(async () => {
    await defaultInjector
      .getInstance(StoreManager)
      .getStoreFor(User)
      .add({
        username: 'testuser',
        password: new HttpAuthenticationSettings().hashMethod('password'),
        roles: [],
      })
  })()
})()

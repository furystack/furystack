import { GoogleLoginAction } from '@furystack/auth-google'
import { ConsoleLogger, LoggerCollection, UserContext } from '@furystack/core'
import {
  ErrorAction,
  GetCurrentUser,
  HttpAuthenticationSettings,
  HttpUserContext,
  LoginAction,
  LogoutAction,
  NotFoundAction,
} from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { TypeOrmStore } from '@furystack/typeorm-store'
import { createServer } from 'https'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'
import { getConnection } from './connection'
import { User } from './Models/User'
;(async () => {
  const defaultInjector = new Injector()

  const loggers = new LoggerCollection()
  loggers.attachLogger(new ConsoleLogger())
  defaultInjector.setExplicitInstance(loggers)

  const typeOrmConnection = await getConnection()

  const userStore = new TypeOrmStore(loggers, typeOrmConnection.getRepository(User)) // new InMemoryStore<ILoginUser<IUser>>('username')

  defaultInjector
    .useHttpApi({
      errorAction: ErrorAction,
      hostName: 'localhost',
      notFoundAction: NotFoundAction,
      protocol: 'https',
      port: 8443,
      corsOptions: {
        credentials: true,
        origins: ['http://localhost:8080'],
      },
      defaultAction: NotFoundAction,
      perRequestServices: [{ key: UserContext, value: HttpUserContext }],
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
      serverFactory: listener =>
        createServer(defaultInjector.getInstance(CertificateManager).getCredentials(), (req, resp) =>
          listener(req, resp),
        ),
    })
    .useHttpAuthentication<User>({
      users: userStore,
    })
  ;(async () => {
    await userStore.add({
      username: 'testuser',
      password: new HttpAuthenticationSettings().hashMethod('password'),
      roles: [],
    })
  })()
})()

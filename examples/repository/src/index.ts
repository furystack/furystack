import { ConsoleLogger, FuryStack, InMemoryStore, IUser, LoggerCollection, UserContext } from '@furystack/core'
import {
  GetCurrentUser,
  HttpApi,
  HttpApiSettings,
  HttpAuthentication,
  HttpAuthenticationSettings,
  HttpUserContext,
  ILoginUser,
  NotFoundAction,
} from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { createServer } from 'https'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'

const defaultInjector = new Injector()
defaultInjector.setupLocalInstance(HttpApi, {
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
      }
      return undefined
    },
  ],
  serverFactory: listener =>
    createServer(defaultInjector.getInstance(CertificateManager).getCredentials(), (req, resp) => listener(req, resp)),
} as Partial<HttpApiSettings>)

const loggers = new LoggerCollection()
loggers.attachLogger(new ConsoleLogger())
defaultInjector.setExplicitInstance(loggers)

const stack = defaultInjector.setupLocalInstance(FuryStack, {
  apis: [HttpApi],
  injectorParent: defaultInjector,
})
;(async () => {
  defaultInjector.setupLocalInstance(HttpAuthentication, {
    users: new InMemoryStore<ILoginUser<IUser>>('username'),
  } as Partial<HttpAuthenticationSettings>)
  await stack.start()
})()

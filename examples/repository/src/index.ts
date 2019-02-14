import {
  ContentAction,
  ContentRepositoryConfiguration,
  ContentSeeder,
  ElevatedRepository,
  ElevatedUserContext,
  FindContent,
  Repository,
  SchemaSeeder,
  SystemContent,
  User,
} from '@furystack/content-repository'
import { ConsoleLogger, FuryStack, LoggerCollection, UserContext } from '@furystack/core'
import {
  GetCurrentUser,
  HttpApi,
  HttpApiConfiguration,
  HttpAuthenticationSettings,
  HttpUserContext,
  NotFoundAction,
} from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { createServer } from 'https'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'

Injector.default.setInstance(
  new ContentRepositoryConfiguration({
    connection: {
      name: '@furystack/example-repository',
      type: 'sqlite',
      database: './db.sqlite',
      synchronize: true,
      logging: true,
    },
  }),
)

Injector.default.setInstance(
  new HttpApiConfiguration({
    protocol: 'https',
    port: 8443,
    corsOptions: {
      credentials: true,
      origins: ['http://localhost:8080'],
    },
    defaultAction: NotFoundAction,
    perRequestServices: [{ key: UserContext, value: HttpUserContext }, { key: Repository, value: Repository }],
    actions: [
      msg => {
        const urlPathName = parse(msg.url || '', true).pathname
        switch (urlPathName) {
          case '/content':
            return ContentAction
          case '/find':
            return FindContent
          case '/currentUser':
            return GetCurrentUser
        }
        return undefined
      },
    ],
    serverFactory: listener =>
      createServer(Injector.default.getInstance(CertificateManager).getCredentials(), (req, resp) =>
        listener(req, resp),
      ),
  }),
)

const loggers = new LoggerCollection()
loggers.attachLogger(new ConsoleLogger())
Injector.default.setInstance(loggers)

Injector.default.setInstance(new CertificateManager())

const stack = new FuryStack({
  apis: [HttpApi],
  injectorParent: Injector.default,
})
;(async () => {
  await usingAsync(new Injector({ parent: Injector.default }), async i => {
    await usingAsync(ElevatedUserContext.create(i), async () => {
      await i.getInstance(SchemaSeeder, true).seedBuiltinEntries()
      await i.getInstance(ContentSeeder, true).seedSystemContent()
    })
  })

  const repo = Injector.default.getInstance(ElevatedRepository)
  const systemContent = Injector.default.getInstance(SystemContent)
  Injector.default.setInstance(
    new HttpAuthenticationSettings({
      users: repo.getPhysicalStoreForType(User),
      visitorUser: systemContent.visitorUser,
    }),
  )

  await stack.start()
})()

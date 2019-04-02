import { GoogleLoginAction } from '@furystack/auth-google'
import { ConsoleLogger, FileStore } from '@furystack/core'
import { GetCurrentUser, LoginAction, LogoutAction } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import '@furystack/odata'
import { EdmType } from '@furystack/odata'
import '@furystack/repository'
import '@furystack/typeorm-store'
import '@furystack/websocket-api'
import { join } from 'path'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'
import { registerExitHandler } from './ExitHandler'
import { Task } from './Models/Task'
import { TestEntry } from './Models/TestEntry'
import { User } from './Models/User'
import { seed } from './seed'
import { MockAction } from './MockAction'

console.log('Current working dir:', process.cwd())

/**
 * Demo app
 */
const defaultInjector = new Injector()

registerExitHandler(defaultInjector)

defaultInjector
  .useLogging(ConsoleLogger)
  /** DB 1 for Users */
  .useTypeOrm({
    name: 'UserDb',
    type: 'sqlite',
    database: join(process.cwd(), 'data', 'users.sqlite'),
    entities: [User],
    synchronize: true,
  })
  /** DB 2 for Tasks */
  .useTypeOrm({
    name: 'TaskDb',
    type: 'sqlite',
    database: join(process.cwd(), 'data', 'tasks.sqlite'),
    entities: [Task],
    synchronize: true,
  })
  .setupStores(sm => {
    sm.addStore(
      TestEntry,
      new FileStore<TestEntry>(join(process.cwd(), 'data', 'testEntries.json'), 'id', 60000, sm.injector.logger),
    )
    sm.useTypeOrmStore(User, 'UserDb').useTypeOrmStore(Task, 'TaskDb')
  })
  .setupRepository(repo => {
    repo
      .createDataSet(User, { name: 'users' })
      .createDataSet(Task, { name: 'tasks' })
      .createDataSet(TestEntry, { name: 'testEntries' })
  })
  .useHttpApi({
    corsOptions: {
      credentials: true,
      origins: ['http://localhost:8080'],
    },
  })
  .useDefaultLoginRoutes()
  .addHttpRouting(msg => {
    const urlPathName = parse(msg.url || '', true).pathname
    if (urlPathName === '/googleLogin') {
      return GoogleLoginAction
    }
  })
  .listenHttp({ port: 80, hostName: 'localhost' })
  .listenHttps({ port: 8443, credentials: new CertificateManager().getCredentials(), hostName: 'localhost' })
  .useHttpAuthentication<User>({
    getUserStore: sm => sm.getStoreFor(User),
  })
  .useWebsockets()
  .useOdata('odata', builder =>
    builder.addNameSpace('default', namespace => {
      namespace
        .setupEntities(entities =>
          entities
            .addEntity({
              model: User,
              primaryKey: 'id',
              fields: [
                {
                  property: 'id',
                  type: EdmType.String,
                },
                {
                  property: 'username',
                  type: EdmType.String,
                },
                {
                  property: 'googleId',
                  type: EdmType.Int64,
                },
              ],
              relations: [],
              actions: {
                mock: {
                  action: MockAction,
                },
              },
              functions: {
                mock: {
                  action: MockAction,
                },
              },
            })
            .addEntity({
              model: Task,
              primaryKey: 'id',
              fields: [{ property: 'id', type: EdmType.String }],
              relations: [
                {
                  propertyName: 'user',
                  foreignKey: 'userId',
                  relatedModel: User,
                },
              ],
            })
            .addEntity({
              model: TestEntry,
              primaryKey: 'id',
              fields: [{ property: 'id', type: EdmType.Int16 }, { property: 'value', type: EdmType.String }],
              relations: [],
            }),
        )
        .setupCollections(collections =>
          collections
            .addCollection({
              name: 'users',
              model: User,
              actions: {},
              functions: {
                current: {
                  action: GetCurrentUser,
                  returnType: User,
                },
              },
            })
            .addCollection({
              name: 'tasks',
              model: Task,
              actions: {},
              functions: {},
            })
            .addCollection({
              name: 'testEntries',
              model: TestEntry,
              actions: {},
              functions: {},
            }),
        )

      namespace.setupGlobalFunctions({
        getCurrentUser: {
          action: GetCurrentUser,
          returnType: User,
        },
      })

      namespace.setupGlobalActions({
        login: {
          parameters: [
            { name: 'username', type: String.name, nullable: false },
            { name: 'password', type: String.name, nullable: false },
          ],
          returnType: User,
          action: LoginAction,
        },
        logout: {
          returnType: User,
          action: LogoutAction,
        },
      })

      return namespace
    }),
  )

seed(defaultInjector)

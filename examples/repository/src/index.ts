import { GoogleLoginAction } from '@furystack/auth-google'
import { FileStore, InMemoryStore } from '@furystack/core'
import { GetCurrentUser, LoginAction, LogoutAction } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { EdmType, NavigationPropertyCollection } from '@furystack/odata'
import '@furystack/odata'
import { NavigationProperty } from '@furystack/odata'
import '@furystack/repository'
import '@furystack/typeorm-store'
import '@furystack/websocket-api'
import { join } from 'path'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'
import { registerExitHandler } from './ExitHandler'
import { MockAction } from './MockAction'
import { Session } from './Models/Session'
import { Task } from './Models/Task'
import { TestEntry } from './Models/TestEntry'
import { User } from './Models/User'
import { seed } from './seed'

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
    sm.addStore(Session, new InMemoryStore('sessionId'))
    sm.useTypeOrmStore(User, 'UserDb').useTypeOrmStore(Task, 'TaskDb')
  })
  .setupRepository(repo => {
    repo
      .createDataSet(User, { name: 'users' })
      .createDataSet(Task, { name: 'tasks' })
      .createDataSet(TestEntry, { name: 'testEntries' })
      .createDataSet(Session, { name: 'sessions' })
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
    getSessionStore: sm => sm.getStoreFor(Session),
  })
  .useWebsockets()
  .useOdata('odata', builder =>
    builder.addNameSpace('default', namespace => {
      namespace
        .setupEntities(entities =>
          entities
            .addEntity({
              model: Session,
              name: 'sessions',
              primaryKey: 'sessionId',
              properties: [
                {
                  property: 'sessionId',
                  type: EdmType.String,
                },
                {
                  property: 'username',
                  type: EdmType.String,
                },
              ],
              navigationProperties: [
                {
                  dataSet: 'users',
                  propertyName: 'user',
                  relatedModel: User,
                  getRelatedEntity: async (entity, dataSet, injector) => {
                    return (await dataSet.filter(injector, { username: entity.username }))[0] as User
                  },
                } as NavigationProperty<User>,
              ],
            })
            .addEntity({
              model: User,
              primaryKey: 'id',
              properties: [
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
              navigationProperties: [
                {
                  dataSet: 'sessions',
                  propertyName: 'sessions',
                  relatedModel: Session,
                  getRelatedEntities: async (entity, dataSet, injector) => {
                    const sessions = await dataSet.filter(injector, { username: entity.username })
                    return sessions
                  },
                } as NavigationPropertyCollection<Session>,
              ],
              actions: {
                mock: {
                  action: MockAction,
                  returnType: EdmType.String,
                },
              },
              functions: {
                mockFunc: {
                  action: MockAction,
                  returnType: EdmType.String,
                },
              },
            })
            .addEntity({
              model: Task,
              primaryKey: 'id',
              properties: [{ property: 'id', type: EdmType.String }],
              navigationProperties: [
                {
                  propertyName: 'user',
                  relatedModel: User,
                  dataSet: 'users',
                  getRelatedEntity: async (_entity, dataSet, injector) => {
                    const result = (await dataSet.filter(injector, { top: 1 }))[0]
                    return result
                  },
                } as NavigationProperty<User>,
                {
                  propertyName: 'users',
                  relatedModel: User,
                  dataSet: 'users',
                  getRelatedEntities: async (_entity, dataSet, injector) => {
                    return await dataSet.filter(injector, {})
                  },
                },
              ],
            })
            .addEntity({
              model: TestEntry,
              primaryKey: 'id',
              properties: [{ property: 'id', type: EdmType.Int16 }, { property: 'value', type: EdmType.String }],
            }),
        )
        .setupCollections(collections =>
          collections
            .addCollection({
              name: 'users',
              model: User,
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
            })
            .addCollection({
              name: 'testEntries',
              model: TestEntry,
            })
            .addCollection({
              name: 'sessions',
              model: Session,
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
            { name: 'username', type: EdmType.String, nullable: false },
            { name: 'password', type: EdmType.String, nullable: false },
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

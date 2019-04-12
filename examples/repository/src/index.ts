import { GoogleLoginAction } from '@furystack/auth-google'
import { FileStore, InMemoryStore } from '@furystack/core'
import { GetCurrentUser, LoginAction, LogoutAction } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { ConsoleLogger } from '@furystack/logging'
import { EdmType, NavigationProperty, NavigationPropertyCollection } from '@furystack/odata'
import '@furystack/odata'
import '@furystack/repository'
import '@furystack/typeorm-store'
import '@furystack/websocket-api'
import { deepMerge } from '@sensenet/client-utils'
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
      new FileStore({
        model: TestEntry,
        fileName: join(process.cwd(), 'data', 'testEntries.json'),
        primaryKey: 'id',
        tickMs: 60000,
        logger: sm.injector.logger,
      }),
    )
      .addStore(
        new InMemoryStore({
          model: Session,
          primaryKey: 'sessionId',
        }),
      )
      .useTypeOrmStore(User, 'UserDb')
      .useTypeOrmStore(Task, 'TaskDb')
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
  // Add API endpoints for '/login', '/logout' and '/currentUser'
  .useDefaultLoginRoutes()
  .addHttpRouting(msg => {
    const urlPathName = parse(msg.url || '', true).pathname
    if (urlPathName === '/googleLogin') {
      return GoogleLoginAction
    }
  })
  // Start HTTP Listener at :80
  .listenHttp({ port: 80, hostName: 'localhost' })
  // Start HTTPS Listener at :8443
  .listenHttps({ port: 8443, credentials: new CertificateManager().getCredentials(), hostName: 'localhost' })
  // Setup authentication with the specific stores
  .useHttpAuthentication({
    userModel: User,
    sessionModel: Session,
    getSession: async (msg, session) => {
      const s: Session = {
        ...session,
        userAgent: msg.headers['user-agent'] as string,
        ip: msg.connection.remoteAddress || 'unknown',
        loginDate: new Date(),
      }
      return s
    },
    getUserStore: sm => sm.getStoreFor(User),
    getSessionStore: sm => sm.getStoreFor(Session),
  })
  // Use Web Socket Endpoint
  .useWebsockets()
  // Setup Odata at '/odata'
  .useOdata('odata', builder =>
    // create default namespace
    builder.addNameSpace('default', namespace => {
      namespace
        // Configure Entities
        .setupEntities(entityBuilder =>
          entityBuilder
            .addEntity({
              model: Session,
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
                {
                  property: 'ip',
                  type: EdmType.String,
                },
                {
                  property: 'userAgent',
                  type: EdmType.String,
                },
                {
                  property: 'loginDate',
                  type: EdmType.DateTime,
                },
              ],
              navigationProperties: [
                {
                  dataSet: 'users',
                  propertyName: 'user',
                  model: Session,
                  relatedModel: User,
                  getRelatedEntity: async (entity, dataSet, injector, filter) => {
                    return (await dataSet.filter(
                      injector,
                      deepMerge(filter, {
                        filter: { username: entity.username },
                      }),
                    ))[0] as User
                  },
                } as NavigationProperty<Session, User>,
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
                  nullable: true,
                },
              ],
              navigationPropertyCollection: [
                {
                  dataSet: 'sessions',
                  propertyName: 'sessions',
                  relatedModel: Session,
                  getRelatedEntities: async (entity, dataSet, injector, filter) => {
                    const sessions = await dataSet.filter(
                      injector,
                      deepMerge(filter, { filter: { username: entity.username } }),
                    )
                    return sessions
                  },
                } as NavigationPropertyCollection<User, Session>,
              ],
              actions: [
                {
                  name: 'mock',
                  action: MockAction,
                  returnType: EdmType.String,
                },
              ],
              functions: [
                {
                  name: 'mockFunc',
                  action: MockAction,
                  returnType: EdmType.String,
                },
              ],
            })
            .addEntity({
              model: Task,
              primaryKey: 'id',
              properties: [
                { property: 'id', type: EdmType.String },
                { property: 'name', type: EdmType.String },
                { property: 'completed', type: EdmType.Boolean },
                { property: 'description', type: EdmType.String },
              ],
              navigationProperties: [
                {
                  propertyName: 'assignee',
                  relatedModel: User,
                  dataSet: 'users',
                  getRelatedEntity: async (entity, dataSet, injector, filter) => {
                    if (!entity.assigneeId) {
                      return []
                    }
                    const result = (await dataSet.filter(
                      injector,
                      deepMerge(filter, { filter: { id: entity.assigneeId } }),
                    ))[0]
                    return result
                  },
                } as NavigationProperty<Task, User>,
              ],
              navigationPropertyCollection: [
                {
                  propertyName: 'reviewers',
                  relatedModel: User,
                  dataSet: 'users',
                  getRelatedEntities: async (_entity, dataSet, injector, filter) => {
                    return await dataSet.filter(injector, deepMerge(filter, { filter: {} }))
                  },
                } as NavigationPropertyCollection<Task, User>,
              ],
            })
            .addEntity({
              model: TestEntry,
              primaryKey: 'id',
              properties: [{ property: 'id', type: EdmType.Int16 }, { property: 'value', type: EdmType.String }],
            }),
        )
        // Configure entity sets
        .setupCollections(collections =>
          collections
            .addCollection({
              name: 'users',
              model: User,
              functions: [
                {
                  name: 'current',
                  action: GetCurrentUser,
                  returnType: User,
                },
              ],
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

      namespace.setupGlobalFunctions([
        {
          name: 'getCurrentuser',
          action: GetCurrentUser,
          returnType: User,
        },
      ])

      // Add login and logout actions to global scope (standard Http Actions)
      namespace.setupGlobalActions([
        {
          name: 'login',
          parameters: [
            { name: 'username', type: EdmType.String, nullable: false },
            { name: 'password', type: EdmType.String, nullable: false },
          ],
          returnType: User,
          action: LoginAction,
        },
        {
          name: 'logout',
          returnType: User,
          action: LogoutAction,
        },
      ])

      return namespace
    }),
  )

// Seed default entries
seed(defaultInjector)

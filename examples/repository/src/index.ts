import { GoogleLoginAction } from '@furystack/auth-google'
import { ConsoleLogger } from '@furystack/core'
import { Injector } from '@furystack/inject'
import '@furystack/odata'
import { EdmType } from '@furystack/odata'
import '@furystack/repository'
import '@furystack/typeorm-store'
import '@furystack/websocket-api'
import { join } from 'path'
import { parse } from 'url'
import { CertificateManager } from './CertificateManager'
import { Task } from './Models/Task'
import { User } from './Models/User'
import { seed } from './seed'

console.log('Current working dir:', process.cwd())

/**
 * Demo app
 */
const defaultInjector = new Injector()

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
    sm.useTypeOrmStore(User, 'UserDb').useTypeOrmStore(Task, 'TaskDb')
  })
  .setupRepository(repo => {
    repo.createDataSet(User, {}).createDataSet(Task)
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
    builder.addNameSpace('default', namespace =>
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
              actions: [],
              functions: [],
            })
            .addEntity({
              model: Task,
              primaryKey: 'id',
              fields: [{ property: 'id', type: EdmType.String }],
              actions: [],
              functions: [],
              relations: [
                {
                  propertyName: 'user',
                  foreignKey: 'userId',
                  relatedModel: User,
                },
              ],
            }),
        )
        .setupCollections(collections =>
          collections
            .addCollection({
              name: 'users',
              model: User,
              actions: [],
              functions: [],
            })
            .addCollection({
              name: 'tasks',
              model: Task,
              actions: [],
              functions: [],
            }),
        ),
    ),
  )

seed(defaultInjector)

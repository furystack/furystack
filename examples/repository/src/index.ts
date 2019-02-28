import { GoogleLoginAction } from '@furystack/auth-google'
import { ConsoleLogger } from '@furystack/core'
import { Injector } from '@furystack/inject'
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
 * Demo Application
 */
;(async () => {
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
    .useHttpApi({
      corsOptions: {
        credentials: true,
        origins: ['http://localhost:8080'],
      },
    })
    .useDefaultLoginRoutes()
    .addHttpRouting(msg => {
      const urlPathName = parse(msg.url || '', true).pathname
      if (urlPathName === '/currentUser') {
        return GoogleLoginAction
      }
    })
    .useHttpAuthentication<User>({
      getUserStore: sm => sm.getStoreFor(User),
    })
    .listenHttp({ port: 80, hostName: 'localhost' })
    .listenHttps({ port: 8443, credentials: new CertificateManager().getCredentials(), hostName: 'localhost' })
    .useWebsockets()
  await seed(defaultInjector)
})()

import { RestApi, RequestAction } from '@furystack/rest'
import { Injector } from '@furystack/inject'
import { ServerManager } from './server-manager'
import { pathToRegexp } from 'path-to-regexp'
import { usingAsync } from '@furystack/utils'
import './incoming-message-extensions'
import './server-response-extensions'
import { CorsOptions } from 'models/cors-options'
import { Utils } from './utils'
import { ErrorAction } from './actions/error-action'

export interface ImplementApiOptions<T extends RestApi> {
  api: T
  injector: Injector
  hostName?: string
  port: number
  cors?: CorsOptions
}

export const implementApi = async <T extends RestApi>({
  hostName,
  port,
  injector,
  api,
  cors,
}: ImplementApiOptions<T>): Promise<void> => {
  const supportedMethods = Object.keys(api)
  const server = await injector.getInstance(ServerManager).getOrCreate({ hostName, port })
  server.listener.subscribe(async ({ req, res }) => {
    const method = req.method?.toUpperCase()
    if (method && req.url && supportedMethods.includes(method)) {
      const action = Object.keys((api as any)[method]).find(route => pathToRegexp(route).test(req.url as string))
      if (action) {
        const reqAction = (api as any)[method][action] as RequestAction<any, any, any>
        await usingAsync(injector.createChild(), async i => {
          const utils = i.getInstance(Utils)
          i.setExplicitInstance(req)
          i.setExplicitInstance(res)
          cors && utils.addCorsHeaders(cors, req, res)
          if (req.method === 'OPTIONS') {
            res.writeHead(200)
            res.end()
            return
          }

          const query = new URLSearchParams(req.url)
          const body = await utils.readPostBody(i.getRequest())
          try {
            const actionResult = await reqAction({ injector: i, body, query })
            res.sendActionResult(actionResult)
          } catch (error) {
            const errorActionResult = await ErrorAction({ injector: i, body: error, query })
            res.sendActionResult(errorActionResult)
          }
        })
      }
    }
  })
}

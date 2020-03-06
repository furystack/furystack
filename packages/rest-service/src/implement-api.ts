import { RestApi, RequestAction } from '@furystack/rest'
import { Injector } from '@furystack/inject'
import { ServerManager } from './server-manager'
import { pathToRegexp } from 'path-to-regexp'
import { usingAsync } from '@furystack/utils'
import './incoming-message-extensions'
import './server-response-extensions'

export interface ImplementApiOptions<T extends RestApi> {
  api: T
  injector: Injector
  hostName?: string
  port: number
}

export const implementApi = async <T extends RestApi>({
  hostName,
  port,
  injector,
  api,
}: ImplementApiOptions<T>): Promise<void> => {
  const supportedMethods = Object.keys(api)
  const server = await injector.getInstance(ServerManager).getOrCreate({ hostName, port })
  server.listener.subscribe(async ({ req, res }) => {
    const method = req.method?.toUpperCase()
    if (method && req.url && supportedMethods.includes(method)) {
      const action = Object.keys((api as any)[method]).find(route => pathToRegexp(route).test(req.url as string))
      if (action) {
        const reqAction = (api as any)[method][action] as RequestAction<any>
        await usingAsync(injector.createChild(), async i => {
          i.setExplicitInstance(req)
          i.setExplicitInstance(res)
          const actionResult = await reqAction(i)
          res.sendActionResult(actionResult)
        })
      }
    }
  })
}

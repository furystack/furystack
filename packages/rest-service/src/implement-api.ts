import { RestApi, RequestAction } from '@furystack/rest'
import { Injector } from '@furystack/inject'
import { ServerManager } from './server-manager'
import { pathToRegexp, match } from 'path-to-regexp'
import { usingAsync, PathHelper } from '@furystack/utils'
import './incoming-message-extensions'
import './server-response-extensions'
import { CorsOptions } from './models/cors-options'
import { Utils } from './utils'
import { ErrorAction } from './actions/error-action'
import { NotFoundAction } from './actions/not-found-action'
import { URL } from 'url'

export interface ImplementApiOptions<T extends RestApi> {
  api: T
  injector: Injector
  hostName?: string
  root: string
  port: number
  cors?: CorsOptions
}

export const implementApi = async <T extends RestApi>({
  hostName,
  port,
  injector,
  api,
  cors,
  root,
}: ImplementApiOptions<T>): Promise<void> => {
  const supportedMethods = Object.keys(api)
  const server = await injector.getInstance(ServerManager).getOrCreate({ hostName, port })

  const rootApiPath = PathHelper.normalize(root)

  const compiledEndpoint: {
    [K: string]: {
      [R: string]: { regex: RegExp; action: RequestAction<any> }
    }
  } = {} as any

  Object.keys(api).forEach(method => {
    const endpoint = {}
    Object.entries((api as any)[method]).forEach(([path, action]) => {
      const fullPath = `/${PathHelper.joinPaths(root, path)}`
      const regex = pathToRegexp(fullPath)
      ;(endpoint as any)[path] = { regex, action, fullPath }
    })
    compiledEndpoint[method] = endpoint
  })

  server.listener.subscribe(async ({ req, res }) => {
    const method = req.method?.toUpperCase()
    if (
      method &&
      req.url &&
      supportedMethods.includes(method) &&
      PathHelper.normalize(req.url).startsWith(rootApiPath)
    ) {
      const fullUrl = new URL(
        PathHelper.joinPaths('http://', `${hostName || ServerManager.DEFAULT_HOST}:${port}`, req.url),
      )

      const { action, regex, fullPath } = (Object.values(compiledEndpoint[method]).find(route =>
        (route as any).regex.test(fullUrl.pathname),
      ) || {}) as {
        action: RequestAction<{ body: {}; result: {}; query: {}; urlParams: {} }>
        regex: RegExp
        fullPath: string
      }
      if (action) {
        // const reqAction = (api as any)[method][action] as RequestAction<any>
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

          try {
            const actionResult = await action({
              injector: i,
              getBody: () => utils.readPostBody<any>(i.getRequest()),
              getQuery: () => {
                return [...fullUrl.searchParams.keys()].reduce((last, current) => {
                  ;(last as any)[current] = fullUrl.searchParams.get(current)
                  return last
                }, {})
              },
              getUrlParams: () => {
                if (!req.url || !regex) {
                  throw new Error('Error parsing request parameters. Missing URL or RegExp.')
                }
                const matcher = match(fullPath, { decode: decodeURIComponent })
                const { params } = matcher(fullUrl.pathname) as any
                return params
              },
            })
            res.sendActionResult(actionResult)
          } catch (error) {
            const errorActionResult = await ErrorAction({ injector: i, getBody: async () => error })
            res.sendActionResult(errorActionResult)
          }
          return
        })
      }
      res.sendActionResult(await NotFoundAction({ injector }))
    }
  })
}

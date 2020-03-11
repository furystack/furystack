import { Disposable, PathHelper, ValueObserver, usingAsync } from '@furystack/utils'
import { RequestAction, RestApi } from '@furystack/rest'
import { Injectable, Injector } from '@furystack/inject'
import { ServerManager, OnRequest } from './server-manager'
import { pathToRegexp, match } from 'path-to-regexp'
import { NotFoundAction } from './actions/not-found-action'
import { CorsOptions } from './models/cors-options'
import { Utils } from './utils'
import { ErrorAction } from './actions/error-action'
import './server-response-extensions'

export interface ImplementApiOptions<T extends RestApi> {
  api: T
  injector: Injector
  hostName?: string
  root: string
  port: number
  cors?: CorsOptions
}

export type CompiledApi = {
  [K: string]: {
    [R: string]: { fullPath: string; regex: RegExp; action: RequestAction<any> }
  }
} & {
  listener: ValueObserver<OnRequest>
}

export type OnRequestOptions = OnRequest & {
  compiledApi: CompiledApi
  hostName?: string
  port: number
  rootApiPath: string
  injector: Injector
  cors?: CorsOptions
  supportedMethods: string[]
}

@Injectable({ lifetime: 'singleton' })
export class ApiManager implements Disposable {
  private readonly apis = new Map<string, CompiledApi>()

  public async dispose() {
    ;[...this.apis.values()].forEach(api => api.listener.dispose())
    this.apis.clear()
  }

  private getSuportedMethods<T extends RestApi>(api: T): string[] {
    return Object.keys(api) as any
  }

  private compileApi<T extends RestApi>(api: T, root: string) {
    const compiledApi = {} as CompiledApi
    this.getSuportedMethods(api).forEach(method => {
      const endpoint = {}

      Object.entries((api as any)[method]).forEach(([path, action]) => {
        const fullPath = `/${PathHelper.joinPaths(root, path)}`
        const regex = pathToRegexp(fullPath)
        ;(endpoint as any)[path] = { regex, action, fullPath }
      })
      ;(compiledApi as any)[method] = endpoint
    })
    return compiledApi
  }

  public async addApi<T extends RestApi>({ api, hostName, port, root, cors, injector }: ImplementApiOptions<T>) {
    const supportedMethods = this.getSuportedMethods(api)
    const rootApiPath = PathHelper.normalize(root)
    const server = await this.serverManager.getOrCreate({ hostName, port })
    const compiledApi = this.compileApi(api, root)
    compiledApi.listener = server.listener.subscribe(msg =>
      this.onMessage({ ...msg, compiledApi, rootApiPath, port, supportedMethods, cors, injector, hostName }),
    )
  }

  private shouldExecRequest(options: {
    method?: string
    url?: string
    rootApiPath: string
    supportedMethods: string[]
  }): boolean {
    return options.method &&
      options.url &&
      options.supportedMethods.includes(options.method) &&
      PathHelper.normalize(options.url).startsWith(options.rootApiPath)
      ? true
      : false
  }

  private getActionFromEndpoint(compiledEndpoint: CompiledApi, method: string, fullUrl: URL) {
    return (Object.values(compiledEndpoint[method]).find(route => (route as any).regex.test(fullUrl.pathname)) ||
      undefined) as
      | {
          action: RequestAction<{ body: {}; result: {}; query: {}; urlParams: {} }>
          regex: RegExp
          fullPath: string
        }
      | undefined
  }

  private async executeAction({
    injector,
    req,
    res,
    cors,
    fullUrl,
    action,
    regex,
    fullPath,
  }: OnRequestOptions & {
    fullUrl: URL
    action: RequestAction<{ body: {}; result: {}; query: {}; urlParams: {} }>
    regex: RegExp
    fullPath: string
  }) {
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

  private async onMessage(options: OnRequestOptions) {
    const method = options.req.method?.toUpperCase() as string
    if (!this.shouldExecRequest({ ...options, method, url: options.req.url })) {
      return
    }
    const fullUrl = new URL(
      PathHelper.joinPaths(
        'http://',
        `${options.hostName || ServerManager.DEFAULT_HOST}:${options.port}`,
        options.req.url as string,
      ),
    )

    const action = this.getActionFromEndpoint(options.compiledApi, method, fullUrl)
    if (action) {
      await this.executeAction({ ...options, ...action, fullUrl })
    } else {
      options.res.sendActionResult(await NotFoundAction({ injector: options.injector }))
    }
  }

  constructor(private readonly serverManager: ServerManager) {}
}

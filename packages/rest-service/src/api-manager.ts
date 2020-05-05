import { Disposable, PathHelper, usingAsync } from '@furystack/utils'
import { RequestAction, RestApi } from '@furystack/rest'
import { Injectable, Injector } from '@furystack/inject'
import { ServerManager, OnRequest } from './server-manager'
import { pathToRegexp, match } from 'path-to-regexp'
import { NotFoundAction } from './actions/not-found-action'
import { CorsOptions } from './models/cors-options'
import { Utils } from './utils'
import { ErrorAction } from './actions/error-action'
import './server-response-extensions'
import { IdentityContext, User } from '@furystack/core/src'
import { HttpUserContext } from 'http-user-context'

export interface ImplementApiOptions<T extends RestApi> {
  api: T
  injector: Injector
  hostName?: string
  root: string
  port: number
  cors?: CorsOptions
  deserializeQueryParams?: (param: string) => any
}

export type CompiledApi = {
  [K: string]: {
    [R: string]: { fullPath: string; regex: RegExp; action: RequestAction<any> }
  }
}

export type OnRequestOptions = OnRequest & {
  compiledApi: CompiledApi
  hostName?: string
  port: number
  rootApiPath: string
  injector: Injector
  cors?: CorsOptions
  supportedMethods: string[]
  deserializeQueryParams?: (param: string) => any
}

@Injectable({ lifetime: 'singleton' })
export class ApiManager implements Disposable {
  private readonly apis = new Map<string, CompiledApi>()

  public dispose() {
    this.apis.clear()
  }

  private getSuportedMethods<T extends RestApi>(api: T): string[] {
    return Object.keys(api) as any
  }

  private compileApi<T extends RestApi>(api: T, root: string) {
    const compiledApi = {} as CompiledApi
    this.getSuportedMethods(api).forEach((method) => {
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

  public async addApi<T extends RestApi>({
    api,
    hostName,
    port,
    root,
    cors,
    injector,
    deserializeQueryParams,
  }: ImplementApiOptions<T>) {
    const supportedMethods = this.getSuportedMethods(api)
    const rootApiPath = PathHelper.normalize(root)
    const server = await this.serverManager.getOrCreate({ hostName, port })
    const compiledApi = this.compileApi(api, root)
    server.apis.push({
      shouldExec: (msg) =>
        this.shouldExecRequest({
          ...msg,
          method: msg.req.method?.toUpperCase(),
          rootApiPath,
          supportedMethods,
          url: PathHelper.normalize(msg.req.url || ''),
        }),
      onRequest: (msg) =>
        this.onMessage({
          ...msg,
          compiledApi,
          rootApiPath,
          port,
          supportedMethods,
          cors,
          injector,
          hostName,
          deserializeQueryParams,
        }),
    })
  }

  public shouldExecRequest(options: {
    method?: string
    url?: string
    rootApiPath: string
    supportedMethods: string[]
  }): boolean {
    return options.method &&
      options.url &&
      (options.supportedMethods.includes(options.method) || options.method === 'OPTIONS') &&
      PathHelper.normalize(options.url).startsWith(options.rootApiPath)
      ? true
      : false
  }

  private getActionFromEndpoint(compiledEndpoint: CompiledApi, fullUrl: URL, method: string) {
    return (Object.values(compiledEndpoint[method]).find((route) => (route as any).regex.test(fullUrl.pathname)) ||
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
    fullUrl,
    action,
    regex,
    fullPath,
    deserializeQueryParams,
  }: OnRequestOptions & {
    fullUrl: URL
    action: RequestAction<{ body: {}; result: {}; query: {}; urlParams: {} }>
    regex: RegExp
    fullPath: string
  }) {
    await usingAsync(injector.createChild(), async (i) => {
      const utils = i.getInstance(Utils)
      const httpUserContext = i.getInstance(HttpUserContext)
      i.setExplicitInstance<IdentityContext>({
        getCurrentUser: <TUser extends User>() => httpUserContext.getCurrentUser(req) as Promise<TUser>,
        isAuthorized: (...roles) => httpUserContext.isAuthorized(req, ...roles),
        isAuthenticated: () => httpUserContext.isAuthenticated(req),
      })
      try {
        const actionResult = await action({
          request: req,
          response: res,
          injector: i,
          getBody: () => utils.readPostBody<any>(req),
          getQuery: () => {
            return [...fullUrl.searchParams.keys()].reduce((last, current) => {
              const currentValue = fullUrl.searchParams.get(current) as string
              ;(last as any)[current] = deserializeQueryParams ? deserializeQueryParams(currentValue) : currentValue
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
        const errorActionResult = await ErrorAction({
          request: req,
          response: res,
          injector: i,
          getBody: async () => error,
        })
        res.sendActionResult(errorActionResult)
      }
      return
    })
  }

  private async onMessage(options: OnRequestOptions) {
    const fullUrl = new URL(
      PathHelper.joinPaths(
        'http://',
        `${options.hostName || ServerManager.DEFAULT_HOST}:${options.port}`,
        options.req.url as string,
      ),
    )

    options.cors && options.injector.getInstance(Utils).addCorsHeaders(options.cors, options.req, options.res)
    if (options.req.method === 'OPTIONS') {
      options.res.writeHead(200)
      options.res.end()
      return
    }

    const action = this.getActionFromEndpoint(options.compiledApi, fullUrl, options.req.method?.toUpperCase() as string)
    if (action) {
      await this.executeAction({ ...options, ...action, fullUrl })
    } else {
      options.res.sendActionResult(
        await NotFoundAction({ injector: options.injector, request: options.req, response: options.res }),
      )
    }
  }

  constructor(private readonly serverManager: ServerManager) {}
}

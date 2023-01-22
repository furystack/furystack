import type { Disposable } from '@furystack/utils'
import { PathHelper, usingAsync } from '@furystack/utils'
import type { Method, RestApi } from '@furystack/rest'
import { deserializeQueryString } from '@furystack/rest'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { OnRequest } from './server-manager'
import { ServerManager } from './server-manager'
import type { MatchFunction } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import { NotFoundAction } from './actions/not-found-action'
import type { CorsOptions } from './models/cors-options'
import { Utils } from './utils'
import { ErrorAction } from './actions/error-action'
import './server-response-extensions'
import type { User } from '@furystack/core'
import { IdentityContext } from '@furystack/core'
import { HttpUserContext } from './http-user-context'
import type { RequestAction } from './request-action-implementation'

export type RestApiImplementation<T extends RestApi> = {
  [TMethod in keyof T]: {
    [TUrl in keyof T[TMethod]]: T[TMethod][TUrl] extends { result: unknown } ? RequestAction<T[TMethod][TUrl]> : never
  }
}

export interface ImplementApiOptions<T extends RestApi> {
  api: RestApiImplementation<T>
  injector: Injector
  hostName?: string
  root: string
  port: number
  cors?: CorsOptions
  deserializeQueryParams?: (param: string) => any
}

export type CompiledApi = {
  [K: string]: {
    [R: string]: { fullPath: string; matcherFn: MatchFunction; action: RequestAction<any> }
  }
}

export type NewCompiledApiEntry = {
  method: Method
  fullPath: string
  matcher: MatchFunction
  action: RequestAction<any>
}

export type NewCompiledApi = {
  [K in Method]?: NewCompiledApiEntry[]
}

export type OnRequestOptions = OnRequest & {
  compiledApi: NewCompiledApi
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

  private getSuportedMethods(api: RestApiImplementation<any>): Method[] {
    return Object.keys(api) as Method[]
  }

  private compileApi<T extends RestApi>(api: RestApiImplementation<T>, root: string) {
    const supportedMethods = this.getSuportedMethods(api)

    const compiledApi: NewCompiledApi = {}
    supportedMethods.forEach((method: Method) => {
      compiledApi[method] = [
        ...Object.entries(api[method as keyof typeof api]).map(([path, action]) => {
          const fullPath = `/${PathHelper.normalize(PathHelper.joinPaths(root, path))}`
          const matcher = match(fullPath, { decode: decodeURIComponent })
          return { method, fullPath, matcher, action: action as RequestAction<any> }
        }),
      ]
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
          method: msg.req.method?.toUpperCase() as Method,
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
    method?: Method
    url?: string
    rootApiPath: string
    supportedMethods: Method[]
  }): boolean {
    return options.method &&
      options.url &&
      (options.supportedMethods.includes(options.method) || options.method === 'OPTIONS') &&
      PathHelper.normalize(options.url).startsWith(options.rootApiPath)
      ? true
      : false
  }

  private getActionFromEndpoint(compiledEndpoint: NewCompiledApi, fullUrl: URL, method: Method) {
    return compiledEndpoint[method]?.find((route) => route.matcher(fullUrl.pathname))
  }

  private async executeAction({
    injector,
    req,
    res,
    fullUrl,
    action,
    matcher,
    deserializeQueryParams,
  }: OnRequestOptions & {
    fullUrl: URL
    action: RequestAction<{ body: {}; result: {}; query: {}; url: {}; headers: {} }>
    matcher: MatchFunction
  }) {
    await usingAsync(injector.createChild(), async (i) => {
      const utils = i.getInstance(Utils)
      const httpUserContext = i.getInstance(HttpUserContext)
      i.setExplicitInstance<IdentityContext>(
        {
          getCurrentUser: <TUser extends User>() => httpUserContext.getCurrentUser(req) as Promise<TUser>,
          isAuthorized: (...roles) => httpUserContext.isAuthorized(req, ...roles),
          isAuthenticated: () => httpUserContext.isAuthenticated(req),
        },
        IdentityContext,
      )
      try {
        const actionResult = await action({
          request: req,
          response: res,
          injector: i,
          getBody: () => utils.readPostBody<any>(req),
          headers: req.headers,
          getQuery: () =>
            deserializeQueryParams ? deserializeQueryParams(fullUrl.search) : deserializeQueryString(fullUrl.search),
          getUrlParams: () => {
            if (!req.url || !matcher) {
              throw new Error('Error parsing request parameters. Missing URL or RegExp.')
            }
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

    const action = this.getActionFromEndpoint(options.compiledApi, fullUrl, options.req.method?.toUpperCase() as Method)
    if (action) {
      await this.executeAction({ ...options, ...action, fullUrl })
    } else {
      options.res.sendActionResult(
        await NotFoundAction({ injector: options.injector, request: options.req, response: options.res }),
      )
    }
  }

  @Injected(ServerManager)
  private readonly serverManager!: ServerManager
}

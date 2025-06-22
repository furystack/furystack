import type { User } from '@furystack/core'
import { IdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { Method, RestApi } from '@furystack/rest'
import { deserializeQueryString } from '@furystack/rest'
import { PathHelper, usingAsync } from '@furystack/utils'
import type { MatchFunction } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import { ErrorAction } from './actions/error-action.js'
import { NotFoundAction } from './actions/not-found-action.js'
import { addCorsHeaders } from './add-cors-header.js'
import { CreateGetSchemaAction } from './endpoint-generators/create-get-schema-action.js'
import { CreateGetSwaggerJsonAction } from './endpoint-generators/create-get-swagger-json-action.js'
import { HttpUserContext } from './http-user-context.js'
import type { CorsOptions } from './models/cors-options.js'
import { readPostBody } from './read-post-body.js'
import type { RequestAction } from './request-action-implementation.js'
import type { OnRequest, ServerApi } from './server-manager.js'
import { ServerManager } from './server-manager.js'
import './server-response-extensions.js'

export type RestApiImplementation<T extends RestApi> = {
  [TMethod in keyof T]: {
    [TUrl in keyof T[TMethod]]: T[TMethod][TUrl] extends { result: unknown } ? RequestAction<T[TMethod][TUrl]> : never
  }
}

export interface ImplementApiOptions<T extends RestApi> {
  /**
   * The structure of the implemented API.
   */
  api: RestApiImplementation<T>
  /**
   * The Injector instance to use for dependency injection in the API actions.
   */
  injector: Injector
  /**
   * The host name for the API Server. If not provided, the default host (ServerManager.DEFAULT_HOST) will be used.
   */
  hostName?: string
  /**
   * The root path for the API. This will be prepended to all API paths.
   */
  root: string
  /**
   * The port on which the API server will listen.
   */
  port: number
  /**
   * CORS options to configure Cross-Origin Resource Sharing for the API.
   */
  cors?: CorsOptions
  /**
   * An optional function to deserialize query parameters from the URL.
   * This function should take a query string (e.g., "?key=value") and return an object with the parsed parameters.
   * If not provided, the default deserialization will be used.
   */
  deserializeQueryParams?: (param: string) => any
  /**
   * Adds an additional 'GET /schema' endpoint that returns the schema definitions of the API.
   * Also adds a 'GET /swagger.json' endpoint that returns the API schema in OpenAPI 3.0 (Swagger) format.
   */
  enableGetSchema?: boolean

  /**
   * Optional name for the API, used in the generated schema.
   * This can be useful for documentation or identification purposes.
   */
  name?: string
  /**
   * Optional description for the API, used in the generated schema.
   * This can provide additional context or information about the API's purpose.
   */
  description?: string
  /**
   * Optional version for the API, used in the generated schema.
   * This can help in versioning the API and tracking changes over time.
   */
  version?: string
}

export type NewCompiledApiEntry = {
  method: Method
  fullPath: string
  matcher: MatchFunction<Partial<Record<string, string | string[]>>>
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
  deserializeQueryParams?: (param: string) => Record<string, unknown>
}

@Injectable({ lifetime: 'singleton' })
export class ApiManager implements Disposable {
  private readonly apis = new Map<string, NewCompiledApi>()

  public [Symbol.dispose]() {
    this.apis.clear()
  }

  private getSuportedMethods(api: RestApiImplementation<RestApi>): Method[] {
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
    enableGetSchema,
    name,
    description,
    version,
  }: ImplementApiOptions<T>) {
    const extendedApi: typeof api = enableGetSchema
      ? {
          ...api,
          GET: {
            ...api.GET,
            '/schema': CreateGetSchemaAction(api, name, description, version),
            '/swagger.json': CreateGetSwaggerJsonAction(api, name, description, version),
          },
        }
      : api

    const supportedMethods = this.getSuportedMethods(extendedApi)
    const rootApiPath = PathHelper.normalize(root)
    const server = await this.serverManager.getOrCreate({ hostName, port })
    const compiledApi = this.compileApi(extendedApi, root)
    const serverApi = {
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
    } satisfies ServerApi
    server.apis.push(serverApi)
    return serverApi
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
    let resolvedParams: unknown
    const action = compiledEndpoint[method]?.find((route) => {
      const result = route.matcher(fullUrl.pathname)
      if (result) {
        resolvedParams = result.params
      }
      return result
    })
    return (
      action && {
        ...action,
        params: resolvedParams,
      }
    )
  }

  private async executeAction({
    injector,
    req,
    res,
    fullUrl,
    action,
    deserializeQueryParams,
    params,
  }: OnRequestOptions & {
    fullUrl: URL
    action: RequestAction<{ body: object; result: object; query: object; url: object; headers: object }>
    params: unknown
  }) {
    await usingAsync(injector.createChild(), async (i) => {
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
          getBody: () => readPostBody<any>(req),
          headers: req.headers,
          getQuery: () =>
            deserializeQueryParams ? deserializeQueryParams(fullUrl.search) : deserializeQueryString(fullUrl.search),
          getUrlParams: () => {
            return params as object
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

    if (options.cors) {
      addCorsHeaders(options.cors, options.req, options.res)
    }

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
  declare private readonly serverManager: ServerManager
}

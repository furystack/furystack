import { IdentityContext, type User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { Method, RestApi } from '@furystack/rest'
import { RequestError, deserializeQueryString } from '@furystack/rest'
import { PathHelper, usingAsync } from '@furystack/utils'
import type { MatchFunction } from 'path-to-regexp'
import { match } from 'path-to-regexp'
import { ErrorAction } from './actions/error-action.js'
import { NotFoundAction } from './actions/not-found-action.js'
import { addCorsHeaders } from './add-cors-header.js'
import { HttpUserContext } from './http-user-context.js'
import type { CorsOptions } from './models/cors-options.js'
import { readPostBody } from './read-post-body.js'
import type { RequestAction } from './request-action-implementation.js'
import './server-response-extensions.js'
import type { OnRequest } from './http-server-pool.js'
import { DEFAULT_HOST } from './http-server-pool.js'

/**
 * Concrete runtime representation of an API implementation — the object the
 * application supplies to `useRestService` gets wrapped in this structure at
 * registration time. Each method maps to an ordered array of compiled routes.
 */
export type RestApiImplementation<T extends RestApi> = {
  [TMethod in keyof T]: {
    [TUrl in keyof T[TMethod]]: T[TMethod][TUrl] extends { result: unknown } ? RequestAction<T[TMethod][TUrl]> : never
  }
}

/**
 * Compiled entry representing a single route: the HTTP method, the fully
 * qualified path, a `path-to-regexp` matcher and the user-supplied
 * action.
 */
export type CompiledApiEntry = {
  method: Method
  fullPath: string
  matcher: MatchFunction<Partial<Record<string, string | string[]>>>
  action: RequestAction<any>
}

/**
 * Grouping of {@link CompiledApiEntry}s keyed by HTTP method. Built once at
 * setup time and reused for every incoming request.
 */
export type CompiledApi = {
  [K in Method]?: CompiledApiEntry[]
}

/** Options accepted by {@link onRestApiMessage}. */
export type OnRestApiMessageOptions = OnRequest & {
  compiledApi: CompiledApi
  hostName?: string
  port: number
  rootApiPath: string
  injector: Injector
  cors?: CorsOptions
  supportedMethods: string[]
  deserializeQueryParams?: (param: string) => Record<string, unknown>
}

/**
 * Compiles a user-supplied REST API definition into the runtime shape used by
 * {@link onRestApiMessage}. Each method's route map is transformed into an
 * array of `{method, fullPath, matcher, action}` entries. The `root` prefix
 * is prepended to every path.
 */
export const compileApi = <T extends RestApi>(api: RestApiImplementation<T>, root: string): CompiledApi => {
  const supportedMethods = Object.keys(api) as Method[]
  const compiled: CompiledApi = {}
  supportedMethods.forEach((method) => {
    compiled[method] = Object.entries(api[method as keyof typeof api]).map(([path, action]) => {
      const fullPath = `/${PathHelper.normalize(PathHelper.joinPaths(root, path))}`
      const matcher = match(fullPath, { decode: decodeURIComponent })
      return { method, fullPath, matcher, action: action as RequestAction<any> }
    })
  })
  return compiled
}

/**
 * Quick eligibility check executed by the server pool before invoking a
 * {@link ServerApi.onRequest}. Avoids the cost of URL parsing and CORS header
 * handling for requests this API clearly does not own.
 */
export const shouldExecRequest = (options: {
  method?: Method
  url?: string
  rootApiPath: string
  supportedMethods: string[]
}): boolean => {
  if (!options.method || !options.url) {
    return false
  }
  if (!options.supportedMethods.includes(options.method) && options.method !== 'OPTIONS') {
    return false
  }
  return PathHelper.matchesBaseUrl(options.url, options.rootApiPath)
}

const getActionFromEndpoint = (compiledApi: CompiledApi, fullUrl: URL, method: Method) => {
  let resolvedParams: unknown
  const action = compiledApi[method]?.find((route) => {
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

const executeAction = async (
  options: OnRestApiMessageOptions & {
    fullUrl: URL
    action: RequestAction<{ body: object; result: object; query: object; url: object; headers: object }>
    params: unknown
  },
): Promise<void> => {
  const { injector, req, res, fullUrl, action, deserializeQueryParams, params } = options
  await usingAsync(injector.createScope({ owner: action }), async (scope) => {
    const httpUserContext = scope.get(HttpUserContext)
    scope.bind(IdentityContext, () => ({
      getCurrentUser: <TUser extends User>() => httpUserContext.getCurrentUser(req) as Promise<TUser>,
      isAuthorized: (...roles) => httpUserContext.isAuthorized(req, ...roles),
      isAuthenticated: () => httpUserContext.isAuthenticated(req),
    }))
    try {
      const actionResult = await action({
        request: req,
        response: res,
        injector: scope,
        getBody: () => readPostBody<never>(req),
        headers: req.headers,
        getQuery: () =>
          deserializeQueryParams ? deserializeQueryParams(fullUrl.search) : deserializeQueryString(fullUrl.search),
        getUrlParams: () => params as object,
      })
      res.sendActionResult(actionResult)
    } catch (error) {
      const errorActionResult = await ErrorAction({
        request: req,
        response: res,
        injector: scope,
        getBody: async () => error,
      })
      res.sendActionResult(errorActionResult)
    }
  })
}

/**
 * Handles a single incoming HTTP request matched by a REST API's
 * {@link ServerApi.shouldExec}. Normalises the URL, applies CORS headers,
 * short-circuits `OPTIONS` preflights and dispatches to the compiled action.
 *
 * Moved out of the deleted `ApiManager.onMessage` verbatim; behaviour is
 * unchanged apart from injector resolution (`get` instead of `getInstance`).
 */
export const onRestApiMessage = async (options: OnRestApiMessageOptions): Promise<void> => {
  const protocol = 'http://'
  const host = `${options.hostName ?? DEFAULT_HOST}:${options.port}`
  const fullUrl = new URL(PathHelper.joinUrl(`${protocol}${host}`, options.req.url as string))

  if (options.cors) {
    addCorsHeaders(options.cors, options.req, options.res)
  }

  if (options.req.method === 'OPTIONS') {
    options.res.writeHead(200)
    options.res.end()
    return
  }

  let action: ReturnType<typeof getActionFromEndpoint>
  try {
    action = getActionFromEndpoint(options.compiledApi, fullUrl, options.req.method?.toUpperCase() as Method)
  } catch (error) {
    const responseError =
      error instanceof URIError ? new RequestError('Failed to decode URL path parameter', 400) : (error as Error)
    const errorActionResult = await ErrorAction({
      request: options.req,
      response: options.res,
      injector: options.injector,
      getBody: async () => responseError,
    })
    options.res.sendActionResult(errorActionResult)
    return
  }

  if (action) {
    await executeAction({ ...options, ...action, fullUrl })
    return
  }

  options.res.sendActionResult(
    await NotFoundAction({ injector: options.injector, request: options.req, response: options.res }),
  )
}

import { useSystemIdentityContext, type User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { RestApi } from '@furystack/rest'
import { PasswordAuthenticator } from '@furystack/security'
import { PathHelper } from '@furystack/utils'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import { createBasicAuthProvider } from './authentication-providers/basic-auth-provider.js'
import { createCookieAuthProvider } from './authentication-providers/cookie-auth-provider.js'
import { authenticateUserWithDataSet, findSessionById, findUserByName } from './authentication-providers/helpers.js'
import { CreateGetOpenApiDocumentAction } from './endpoint-generators/create-get-openapi-document-action.js'
import { CreateGetSchemaAction } from './endpoint-generators/create-get-schema-action.js'
import { defaultHttpAuthenticationSettings, HttpAuthenticationSettings } from './http-authentication-settings.js'
import { HttpServerPoolToken, type ServerApi } from './http-server-pool.js'
import { HttpUserContext } from './http-user-context.js'
import type { CorsOptions } from './models/cors-options.js'
import { buildProxyServerApi, type ProxyOptions } from './proxy-runtime.js'
import { compileApi, onRestApiMessage, type RestApiImplementation, shouldExecRequest } from './rest-api-runtime.js'
import { ServerTelemetryToken } from './server-telemetry.js'
import { buildStaticSiteServerApi, type StaticServerOptions } from './static-site-runtime.js'

/**
 * Options accepted by {@link useRestService}. Mirrors the pre-migration
 * shape, minus fields that have moved to tokens.
 */
export interface ImplementApiOptions<T extends RestApi> {
  /** The structure of the implemented API. */
  api: RestApiImplementation<T>
  /** Injector used to resolve request-scoped services and to acquire the HTTP server. */
  injector: Injector
  /** Optional host name; defaults to `localhost`. */
  hostName?: string
  /** Root path prepended to every API route. */
  root: string
  /** Port the API should listen on. */
  port: number
  /** Optional CORS configuration applied to every matched request. */
  cors?: CorsOptions
  /** Optional query-string deserialiser override. */
  deserializeQueryParams?: (param: string) => Record<string, unknown>
  /** When `true`, adds `GET /schema` and `GET /openapi.json` endpoints. */
  enableGetSchema?: boolean
  /** OpenAPI display name. */
  name?: string
  /** OpenAPI description. */
  description?: string
  /** OpenAPI version. */
  version?: string
}

/**
 * Acquires a pooled HTTP server, compiles the user-supplied API definition
 * and attaches a {@link ServerApi} that dispatches matching requests.
 *
 * Public contract is unchanged from the pre-migration release; internally
 * everything goes through the functional tokens.
 */
export const useRestService = async <T extends RestApi>(options: ImplementApiOptions<T>): Promise<ServerApi> => {
  const {
    injector,
    api,
    hostName,
    port,
    root,
    cors,
    deserializeQueryParams,
    enableGetSchema,
    name,
    description,
    version,
  } = options

  const extendedApi: typeof api = enableGetSchema
    ? ({
        ...api,
        GET: {
          ...api.GET,
          '/schema': CreateGetSchemaAction(api, name, description, version),
          '/openapi.json': CreateGetOpenApiDocumentAction(api, name, description, version),
        },
      } as typeof api)
    : api

  const supportedMethods = Object.keys(extendedApi)
  const rootApiPath = PathHelper.normalize(root)
  const compiledApi = compileApi(extendedApi, root)

  const serverApi: ServerApi = {
    shouldExec: ({ req }) =>
      shouldExecRequest({
        method: req.method?.toUpperCase() as never,
        url: PathHelper.normalize(req.url || ''),
        rootApiPath,
        supportedMethods,
      }),
    onRequest: (msg) =>
      onRestApiMessage({
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
  }

  const pool = injector.get(HttpServerPoolToken)
  const record = await pool.acquire({ port, hostName })
  record.apis.push(serverApi)
  return serverApi
}

/**
 * Installs HTTP authentication on the given injector: builds the provider
 * chain (Basic + Cookie by default), appends any caller-provided providers
 * and rebinds {@link HttpAuthenticationSettings}.
 *
 * Prerequisite: {@link UserStore} and {@link SessionStore} must be bound to
 * persistent implementations before calling this helper, since the Basic
 * and Cookie providers need to read users and sessions immediately.
 */
export const useHttpAuthentication = (injector: Injector, overrides?: Partial<HttpAuthenticationSettings>): void => {
  const mergedSettings: HttpAuthenticationSettings = {
    ...defaultHttpAuthenticationSettings(),
    ...overrides,
  }
  const systemInjector = useSystemIdentityContext({ injector, username: 'useHttpAuthentication' })
  const passwordAuthenticator = injector.get(PasswordAuthenticator)
  const userDataSet = systemInjector.get(mergedSettings.userDataSet) as unknown as DataSet<User, 'username'>
  const sessionDataSet = systemInjector.get(mergedSettings.sessionDataSet)

  const providers: AuthenticationProvider[] = []
  if (mergedSettings.enableBasicAuth) {
    providers.push(
      createBasicAuthProvider((username, password) =>
        authenticateUserWithDataSet(passwordAuthenticator, userDataSet, systemInjector, username, password),
      ),
    )
  }
  providers.push(
    createCookieAuthProvider(
      mergedSettings.cookieName,
      (sessionId) => findSessionById(sessionDataSet, systemInjector, sessionId),
      (username) => findUserByName(userDataSet, systemInjector, username),
    ),
  )
  providers.push(...(overrides?.authenticationProviders ?? []))
  mergedSettings.authenticationProviders = providers

  injector.bind(HttpAuthenticationSettings, () => mergedSettings)
  injector.invalidate(HttpAuthenticationSettings)
  injector.invalidate(HttpUserContext)
}

/**
 * Attaches a static-file {@link ServerApi} to the pooled HTTP server
 * identified by `options.port`/`options.hostName`.
 */
export const useStaticFiles = async (options: { injector: Injector } & StaticServerOptions): Promise<ServerApi> => {
  const { injector, ...settings } = options
  const pool = injector.get(HttpServerPoolToken)
  const record = await pool.acquire({ port: settings.port, hostName: settings.hostName })
  const serverApi = buildStaticSiteServerApi(settings)
  record.apis.push(serverApi)
  return serverApi
}

/**
 * Attaches a proxy {@link ServerApi} that forwards HTTP (and optionally
 * WebSocket) traffic from `options.sourceBaseUrl` to `options.targetBaseUrl`.
 * Emits `onProxyFailed` and `onWebSocketProxyFailed` events into the shared
 * {@link ServerTelemetryToken} — subscribe there for observability.
 */
export const useProxy = async (options: { injector: Injector } & ProxyOptions): Promise<ServerApi> => {
  const { injector, ...settings } = options
  const telemetry = injector.get(ServerTelemetryToken)
  const pool = injector.get(HttpServerPoolToken)
  const record = await pool.acquire({ port: settings.sourcePort, hostName: settings.sourceHostName })
  const serverApi = buildProxyServerApi(settings, telemetry)
  record.apis.push(serverApi)
  return serverApi
}

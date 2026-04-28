import { AggregatedError, IdentityContext, type User } from '@furystack/core'
import type { Injector, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { HttpServerPoolToken, HttpUserContext, ServerTelemetryToken, type ServerApi } from '@furystack/rest-service'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { URL } from 'url'
import type WebSocket from 'ws'
import ws, { WebSocketServer } from 'ws'
import type { WebSocketAction } from './models/websocket-action.js'

/**
 * Events emitted by a {@link WebSocketApi} handle. Per-connection lifecycle
 * events stay on the handle — each `useWebSocketApi` call returns its own
 * EventHub — while action-execution errors are forwarded to the shared
 * `ServerTelemetryToken` under `onWebSocketActionFailed`.
 */
export type WebSocketApiEvents = {
  onClientConnected: { ws: WebSocket; message: IncomingMessage }
  /** Fires after the per-connection scope has been disposed. */
  onClientDisconnected: { ws: WebSocket }
  onListenerError: ListenerErrorPayload
}

/**
 * Callback payload supplied to {@link WebSocketApi.broadcast}.
 */
export interface WebSocketBroadcastContext {
  injector: Injector
  ws: WebSocket
  message: IncomingMessage
}

/**
 * Handle returned by {@link useWebSocketApi}. Exposes the underlying
 * `WebSocketServer`, a `broadcast` helper and the `ServerApi` that was
 * pushed onto the pooled HTTP server. Extends {@link EventHub} so callers
 * can subscribe to per-connection lifecycle events.
 */
export interface WebSocketApi extends EventHub<WebSocketApiEvents> {
  readonly socket: WebSocketServer
  readonly serverApi: ServerApi
  broadcast(callback: (options: WebSocketBroadcastContext) => void | Promise<void>): Promise<void>
}

/**
 * Options accepted by {@link useWebSocketApi}.
 */
export interface UseWebSocketApiOptions {
  /** Injector whose HTTP server pool should host the websocket endpoint. */
  injector: Injector
  /** Port of the pooled HTTP server. */
  port: number
  /** Optional host name; defaults to `localhost`. */
  hostName?: string
  /** URL path the websocket endpoint answers on. Defaults to `/socket`. */
  path?: string
  /** Action descriptors consulted for every incoming message (first match wins). */
  actions?: WebSocketAction[]
}

/**
 * Scoped registry of per-injector websocket-api cleanup callbacks. Using
 * a DI-managed set lets `useWebSocketApi` register disposal through the
 * injector's `onDispose` hook without needing a factory context at the
 * call site. Callbacks run before the HTTP server pool tears down its
 * `http.Server` instances because they are registered after pool
 * resolution — the injector disposes in reverse registration order.
 */
const WebSocketApiCleanupRegistry: Token<Set<() => Promise<void>>, 'scoped'> = defineService({
  name: 'furystack/websocket-api/WebSocketApiCleanupRegistry',
  lifetime: 'scoped',
  factory: ({ onDispose }) => {
    const cleanups = new Set<() => Promise<void>>()
    onDispose(async () => {
      // Snapshot + clear first so nested emits during cleanup can't re-enter.
      const pending = [...cleanups]
      cleanups.clear()
      await Promise.allSettled(pending.map((cleanup) => cleanup()))
    })
    return cleanups
  },
})

/**
 * Opens a websocket endpoint on the pooled HTTP server identified by
 * `port` / `hostName`. Returns the {@link WebSocketApi} handle; disposal
 * is tied to the injector scope that owns it — closing open clients,
 * tearing down per-connection scopes and closing the `WebSocketServer`.
 */
export const useWebSocketApi = async (options: UseWebSocketApiOptions): Promise<WebSocketApi> => {
  const { injector, port, hostName, path = '/socket', actions = [] } = options

  const telemetry = injector.get(ServerTelemetryToken)
  const pool = injector.get(HttpServerPoolToken)
  const cleanups = injector.get(WebSocketApiCleanupRegistry)

  const socket = new WebSocketServer({ noServer: true })
  const clients = new Map<WebSocket, { injector: Injector; ws: WebSocket; message: IncomingMessage }>()

  class WebSocketApiHub extends EventHub<WebSocketApiEvents> {}
  const handle = new WebSocketApiHub()

  const execute = async (
    data: WebSocket.Data,
    request: IncomingMessage,
    connectionInjector: Injector,
    client: WebSocket,
  ): Promise<void> => {
    // Each incoming message runs in its own scope so per-request services
    // (notably `HttpUserContext` with its cached user) resolve fresh every
    // time — mirrors the rest-service per-request scope pattern.
    const messageScope = connectionInjector.createScope({ owner: data })
    try {
      // IdentityContext binding is lazy so actions that never touch
      // authentication don't force `HttpUserContext` (and its upstream
      // auth stores) to be configured.
      messageScope.bind(IdentityContext, () => {
        const httpUserContext = messageScope.get(HttpUserContext)
        return {
          getCurrentUser: <TUser extends User>() => httpUserContext.getCurrentUser(request) as Promise<TUser>,
          isAuthorized: (...roles) => httpUserContext.isAuthorized(request, ...roles),
          isAuthenticated: () => httpUserContext.isAuthenticated(request),
        }
      })
      const action = actions.find((candidate) => candidate.canExecute({ data, request, socket: client }))
      if (action) {
        await action.execute({ data, request, socket: client, injector: messageScope })
      }
    } catch (error) {
      telemetry.emit('onWebSocketActionFailed', { error, data, socket: client })
    } finally {
      await messageScope[Symbol.asyncDispose]().catch((error: unknown) => {
        telemetry.emit('onWebSocketActionFailed', { error, data, socket: client })
      })
    }
  }

  socket.on('connection', (client, msg) => {
    const connectionInjector = injector.createScope({ owner: msg })

    clients.set(client, { injector: connectionInjector, message: msg, ws: client })
    handle.emit('onClientConnected', { ws: client, message: msg })

    client.on('message', (data) => {
      void execute(data, msg, connectionInjector, client)
    })

    client.on('error', (error) => {
      telemetry.emit('onWebSocketActionFailed', { error, socket: client })
    })

    client.on('close', () => {
      clients.delete(client)
      connectionInjector[Symbol.asyncDispose]().catch((error: unknown) => {
        telemetry.emit('onWebSocketActionFailed', { error, socket: client })
      })
      handle.emit('onClientDisconnected', { ws: client })
    })
  })

  const serverApi: ServerApi = {
    shouldExec: ({ req }) => {
      const { pathname } = new URL(req.url as string, `http://${req.headers.host}`)
      return pathname === path
    },
    onRequest: async () => {
      // WebSocket endpoint never serves regular HTTP requests.
    },
    onUpgrade: async ({ req, socket: duplex, head }) => {
      socket.handleUpgrade(req, duplex, head, (client) => {
        socket.emit('connection', client, req)
      })
    },
  }

  const record = await pool.acquire({ port, hostName })
  record.apis.push(serverApi)

  const cleanup = async (): Promise<void> => {
    socket.clients.forEach((client) => client.close())
    socket.clients.forEach((client) => client.terminate())
    await new Promise<void>((resolve, reject) => socket.close((err) => (err ? reject(err) : resolve())))
    await Promise.allSettled([...clients.values()].map((client) => client.injector[Symbol.asyncDispose]()))
    clients.clear()
    // eslint-disable-next-line furystack/prefer-using-wrapper
    handle[Symbol.dispose]()
  }
  cleanups.add(cleanup)

  return Object.assign(handle, {
    socket,
    serverApi,
    broadcast: async (callback: (ctx: WebSocketBroadcastContext) => void | Promise<void>): Promise<void> => {
      const errors: unknown[] = []
      await Promise.all(
        [...clients.values()]
          .filter((client) => client.ws.readyState === ws.OPEN)
          .map(async (client) => {
            try {
              await callback(client)
            } catch (error) {
              errors.push(error)
            }
          }),
      )
      if (errors.length) {
        throw new AggregatedError('The Broadcast operation encountered some errors', errors)
      }
    },
  })
}

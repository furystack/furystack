import { defineService, type Token } from '@furystack/inject'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { createServer } from 'http'
import type { Socket } from 'net'
import type { Duplex } from 'stream'
import { ServerTelemetryToken } from './server-telemetry.js'

/**
 * Options accepted by {@link HttpServerPool.acquire}.
 */
export interface ServerOptions {
  hostName?: string
  port: number
}

/** Payload passed to every {@link ServerApi.onRequest} invocation. */
export interface OnRequest {
  req: IncomingMessage
  res: ServerResponse
}

/** Payload passed to every {@link ServerApi.onUpgrade} invocation. */
export interface OnUpgrade {
  req: IncomingMessage
  socket: Duplex
  head: Buffer
}

/**
 * Contract every server-side consumer (REST, static sites, proxies,
 * websockets) implements. Pushed into {@link ServerRecord.apis} by
 * `useRestService` / `useStaticFiles` / `useProxy` / websocket wiring.
 */
export interface ServerApi {
  shouldExec: (options: OnRequest) => boolean
  onRequest: (options: OnRequest) => Promise<void>
  onUpgrade?: (options: OnUpgrade) => Promise<void>
}

/**
 * Shared-port registry entry. Multiple {@link ServerApi}s attached to the
 * same `port`/`hostName` share a single `http.Server` via the pool and
 * dispatch to the first matching `shouldExec`.
 */
export interface ServerRecord {
  server: Server
  apis: ServerApi[]
}

export const DEFAULT_HOST = 'localhost'

const buildHostUrl = (options: ServerOptions): string => `http://${options.hostName ?? DEFAULT_HOST}:${options.port}`

/**
 * Public surface of the {@link HttpServerPoolToken}. Acquires shared
 * `http.Server` instances keyed by url. Consumers push their
 * {@link ServerApi}s onto the returned record's `apis` array.
 *
 * Internal to the rest-service package — application code interacts with
 * the pool indirectly through `useRestService` / `useStaticFiles` /
 * `useProxy`.
 */
export interface HttpServerPool {
  /**
   * Returns the {@link ServerRecord} for the given options, opening a new
   * `http.Server` on first request and returning the cached instance on
   * subsequent requests to the same url.
   */
  acquire(options: ServerOptions): Promise<ServerRecord>
}

/**
 * DI token for the {@link HttpServerPool}. Scoped so each test / application
 * scope has its own set of HTTP servers and sockets.
 */
export const HttpServerPoolToken: Token<HttpServerPool, 'scoped'> = defineService({
  name: 'furystack/rest-service/HttpServerPool',
  lifetime: 'scoped',
  factory: ({ inject, onDispose }): HttpServerPool => {
    const telemetry = inject(ServerTelemetryToken)
    const servers = new Map<string, ServerRecord>()
    const pendingCreates = new Map<string, Promise<ServerRecord>>()
    const openedSockets = new Set<Socket>()

    const trackConnection = (socket: Socket): void => {
      openedSockets.add(socket)
      socket.once('close', () => openedSockets.delete(socket))
    }

    const createRecord = async (url: string, options: ServerOptions): Promise<ServerRecord> => {
      const apis: ServerApi[] = []
      const server = createServer((req, res) => {
        const apiMatch = apis.find((api) => api.shouldExec({ req, res }))
        if (apiMatch) {
          apiMatch.onRequest({ req, res }).catch((error) => {
            telemetry.emit('onRequestFailed', [error, req, res])
          })
          return
        }
        res.destroy()
      })
      server.on('upgrade', (req, socket, head) => {
        const apiMatch = apis.find((api) => api.shouldExec({ req, res: {} as ServerResponse }))
        if (apiMatch?.onUpgrade) {
          apiMatch.onUpgrade({ req, socket, head }).catch((error) => {
            telemetry.emit('onRequestFailed', [error, req, {} as ServerResponse])
            socket.destroy()
          })
          return
        }
        socket.destroy()
      })
      server.on('connection', trackConnection)

      try {
        await new Promise<void>((resolve, reject) => {
          server.on('listening', () => resolve())
          server.on('error', (err) => reject(err))
          server.listen(options.port, options.hostName)
        })
        const record: ServerRecord = { server, apis }
        servers.set(url, record)
        telemetry.emit('onServerListening', { url, port: options.port, hostName: options.hostName })
        return record
      } finally {
        pendingCreates.delete(url)
      }
    }

    onDispose(async () => {
      await Promise.allSettled([...pendingCreates.values()])
      openedSockets.forEach((socket) => socket.destroy())
      await Promise.allSettled(
        [...servers.entries()].map(
          ([url, record]) =>
            new Promise<void>((resolve, reject) => {
              record.server.close((err) => {
                if (err) {
                  reject(err)
                  return
                }
                telemetry.emit('onServerClosed', { url })
                resolve()
              })
              record.server.off('connection', trackConnection)
            }),
        ),
      )
      servers.clear()
    })

    return {
      acquire: async (options) => {
        const url = buildHostUrl(options)
        const existing = servers.get(url)
        if (existing) {
          return existing
        }
        const pending = pendingCreates.get(url)
        if (pending) {
          return pending
        }
        const createPromise = createRecord(url, options)
        pendingCreates.set(url, createPromise)
        return createPromise
      },
    }
  },
})

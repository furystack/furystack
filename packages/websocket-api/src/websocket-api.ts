import { AggregatedError, IdentityContext, type User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { HttpUserContext, ServerManager } from '@furystack/rest-service'
import { using } from '@furystack/utils'
import { IncomingMessage } from 'http'
import { URL } from 'url'
import type WebSocket from 'ws'
import type { Data } from 'ws'
import ws, { WebSocketServer } from 'ws'
import type { WebSocketAction } from './models/websocket-action.js'
import { WebSocketApiSettings } from './websocket-api-settings.js'

/**
 * A WebSocket API implementation for FuryStack
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApi implements AsyncDisposable {
  public readonly socket = new WebSocketServer({ noServer: true })

  private clients = new Map<ws, { injector: Injector; ws: ws; message: IncomingMessage }>()

  @Injected(WebSocketApiSettings)
  declare private readonly settings: WebSocketApiSettings

  @Injected(ServerManager)
  declare private readonly serverManager: ServerManager

  declare private readonly injector: Injector

  private isInitialized = false
  public async init() {
    if (!this.isInitialized) {
      this.socket.on('connection', (websocket, msg) => {
        const connectionInjector = this.injector.createChild({ owner: msg })

        const httpUserContext = connectionInjector.getInstance(HttpUserContext)
        connectionInjector.setExplicitInstance<IdentityContext>(
          {
            getCurrentUser: <TUser extends User>() => httpUserContext.getCurrentUser(msg) as Promise<TUser>,
            isAuthorized: (...roles) => httpUserContext.isAuthorized(msg, ...roles),
            isAuthenticated: () => httpUserContext.isAuthenticated(msg),
          },
          IdentityContext,
        )

        this.clients.set(websocket, { injector: connectionInjector, message: msg, ws: websocket })
        websocket.on('message', (message) => {
          this.execute(message, msg, connectionInjector, websocket)
        })

        websocket.on('close', () => {
          this.clients.delete(websocket)
          connectionInjector[Symbol.asyncDispose]().catch((err) => {
            console.error('Error disposing connection injector:', err)
          })
        })
      })

      const server = await this.serverManager.getOrCreate({ port: this.settings.port, hostName: this.settings.host })

      // Register as a ServerApi
      server.apis.push({
        shouldExec: (options) => {
          const { pathname } = new URL(options.req.url as string, `http://${options.req.headers.host}`)
          return pathname === this.settings.path
        },
        onRequest: async () => {
          // No regular HTTP requests for WebSocket API
        },
        onUpgrade: async ({ req, socket, head }) => {
          this.socket.handleUpgrade(req, socket, head, (websocket) => {
            this.socket.emit('connection', websocket, req)
          })
        },
      })

      this.isInitialized = true
    } else {
      throw Error('WebSocket API is already initialized')
    }
  }
  public async [Symbol.asyncDispose]() {
    this.socket.clients.forEach((client) => client.close())
    this.socket.clients.forEach((client) => client.terminate())
    await new Promise<void>((resolve, reject) => this.socket.close((err) => (err ? reject(err) : resolve())))
    // Dispose all child injectors
    await Promise.allSettled([...this.clients.values()].map((client) => client.injector[Symbol.asyncDispose]()))
    this.clients.clear()
  }

  public async broadcast(
    callback: (options: { injector: Injector; ws: ws; message: IncomingMessage }) => void | Promise<void>,
  ) {
    const errors: unknown[] = []
    await Promise.all(
      [...this.clients.values()]
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
  }

  public execute(data: Data, request: IncomingMessage, injector: Injector, socket: WebSocket) {
    const Action = this.settings.actions.find((a) => a.canExecute({ data, request, socket }))
    if (Action) {
      using(injector.getInstance<WebSocketAction>(Action), (action) => {
        void action.execute({ data, request, socket })
      })
    }
  }
}

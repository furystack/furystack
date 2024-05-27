import { URL } from 'url'
import type { Socket } from 'net'
import { IncomingMessage } from 'http'
import { HttpUserContext, ServerManager } from '@furystack/rest-service'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { using, type Disposable } from '@furystack/utils'
import type { Data } from 'ws'
import type WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import ws from 'ws'
import { WebSocketApiSettings } from './websocket-api-settings.js'
import type { WebSocketAction } from './models/websocket-action.js'
import { AggregatedError, IdentityContext, type User } from '@furystack/core'

/**
 * A WebSocket API implementation for FuryStack
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApi implements Disposable {
  public readonly socket = new WebSocketServer({ noServer: true })

  private clients = new Map<ws, { injector: Injector; ws: ws; message: IncomingMessage }>()

  @Injected(WebSocketApiSettings)
  private declare readonly settings: WebSocketApiSettings

  @Injected(ServerManager)
  private declare readonly serverManager: ServerManager

  private declare readonly injector: Injector

  private isInitialized = false
  public async init() {
    if (!this.isInitialized) {
      this.socket.on('connection', (websocket, msg) => {
        const connectionInjector = this.injector.createChild({ owner: msg })
        connectionInjector.setExplicitInstance(websocket, ws)
        connectionInjector.setExplicitInstance(msg, IncomingMessage)

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
        })
      })

      await this.serverManager
        .getOrCreate({ port: this.settings.port, hostName: this.settings.host })
        .then((server) => {
          server.server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
            const { pathname } = new URL(request.url as string, `http://${request.headers.host}`)
            if (pathname === this.settings.path) {
              this.socket.handleUpgrade(request, socket, head, (websocket) => {
                this.socket.emit('connection', websocket, request)
              })
            }
          })
        })
    } else {
      throw Error('WebSocket API is already initialized')
    }
  }
  public async dispose() {
    this.socket.clients.forEach((client) => client.close())
    this.socket.clients.forEach((client) => client.terminate())
    await new Promise<void>((resolve, reject) => this.socket.close((err) => (err ? reject(err) : resolve())))
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
        action.execute({ data, request, socket })
      })
    }
  }
}

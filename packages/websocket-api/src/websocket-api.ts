import { URL } from 'url'
import type { Socket } from 'net'
import { IncomingMessage } from 'http'
import { ServerManager } from '@furystack/rest-service'
import { Injectable, Injected, Injector } from '@furystack/inject'
import type { Disposable } from '@furystack/utils'
import type { Data } from 'ws'
import { WebSocketServer } from 'ws'
import ws from 'ws'
import { WebSocketApiSettings } from './websocket-api-settings.js'
import type { WebSocketAction } from './models/websocket-action.js'
import { AggregatedError, IdentityContext } from '@furystack/core'
import { WebsocketUserContext } from './websocket-user-context.js'

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

  @Injected(Injector)
  private declare readonly injector: Injector

  private isInitialized = false
  public init() {
    if (!this.isInitialized) {
      this.socket.on('connection', (websocket, msg) => {
        const connectionInjector = this.injector.createChild({ owner: msg })
        connectionInjector.setExplicitInstance(websocket, ws)
        connectionInjector.setExplicitInstance(msg, IncomingMessage)
        connectionInjector.setExplicitInstance(connectionInjector.getInstance(WebsocketUserContext), IdentityContext)
        this.clients.set(websocket, { injector: connectionInjector, message: msg, ws: websocket })
        websocket.on('message', (message) => {
          this.execute(message, connectionInjector)
        })

        websocket.on('close', () => {
          this.clients.delete(websocket)
        })
      })

      this.serverManager.getOrCreate({ port: this.settings.port, hostName: this.settings.host }).then((server) => {
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

  public execute(data: Data, injector: Injector) {
    const action = this.settings.actions.find((a) => a.canExecute({ data }))
    if (action) {
      const actionInstance = injector.getInstance<WebSocketAction>(action)
      actionInstance.execute({ data })
    }
  }
}

import { parse } from 'url'
import { IncomingMessage } from 'http'
import { ServerManager } from '@furystack/rest-service'
import { Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import ws, { Data, Server as WebSocketServer } from 'ws'
import { WebSocketApiSettings } from './websocket-api-settings'
import { WebSocketAction } from './models'
import { AggregatedError, IdentityContext } from '@furystack/core'
import { WebsocketUserContext } from './websocket-user-context'

/**
 * A WebSocket API implementation for FuryStack
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApi implements Disposable {
  public readonly socket: WebSocketServer
  private readonly injector: Injector

  private clients = new Map<ws, { injector: Injector; ws: ws; message: IncomingMessage }>()

  constructor(private settings: WebSocketApiSettings, public serverManager: ServerManager, parentInjector: Injector) {
    this.socket = new WebSocketServer({ noServer: true })
    this.injector = parentInjector.createChild({ owner: this })
    this.socket.on('connection', (websocket, msg) => {
      const connectionInjector = this.injector.createChild({ owner: msg })
      connectionInjector.setExplicitInstance(websocket, ws)
      connectionInjector.setExplicitInstance(msg, IncomingMessage)
      connectionInjector.setExplicitInstance(new WebsocketUserContext(connectionInjector), IdentityContext)
      this.clients.set(websocket, { injector: connectionInjector, message: msg, ws: websocket })
      websocket.on('message', (message) => {
        this.execute(message, connectionInjector)
      })

      websocket.on('close', () => {
        this.clients.delete(websocket)
      })
    })

    serverManager.getOrCreate({ port: this.settings.port, hostName: this.settings.host }).then((server) => {
      server.server.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url)
        if (pathname === this.settings.path) {
          this.socket.handleUpgrade(request, socket, head, (websocket) => {
            this.socket.emit('connection', websocket, request)
          })
        }
      })
    })
  }
  public async dispose() {
    this.socket.clients.forEach((client) => client.close())
    this.socket.clients.forEach((client) => client.terminate())
    await new Promise<void>((resolve, reject) => this.socket.close((err) => (err ? reject(err) : resolve())))
  }

  public async broadcast(
    callback: (options: { injector: Injector; ws: ws; message: IncomingMessage }) => void | Promise<void>,
  ) {
    const errors: any[] = []
    await Promise.all(
      [...this.clients.values()]
        .filter((client) => client.ws.readyState === WebSocket.OPEN)
        .map(async (client) => {
          try {
            await callback(client)
          } catch (error) {
            errors.push({ message: error.message, stack: error.stack })
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

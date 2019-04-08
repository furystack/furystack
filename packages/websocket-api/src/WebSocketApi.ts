import { LoggerCollection, ServerManager } from '@furystack/core'
import { Injectable, Injector } from '@furystack/inject'
import { usingAsync } from '@sensenet/client-utils'
import { IncomingMessage } from 'http'
import { parse } from 'url'
import { Data, Server as WebSocketServer } from 'ws'
import ws from 'ws'
import { IWebSocketAction } from './models/IWebSocketAction'
import { WebSocketApiSettings } from './WebSocketApiSettings'

/**
 * A WebSocket API implementation for FuryStack
 */
@Injectable({ lifetime: 'scoped' })
export class WebSocketApi {
  private readonly socket: WebSocketServer
  private readonly injector: Injector
  private readonly logScope: string = '@furystack/websocket-api/' + this.constructor.name
  constructor(
    private readonly logger: LoggerCollection,
    private settings: WebSocketApiSettings,
    public serverManager: ServerManager,
    parentInjector: Injector,
  ) {
    this.logger.verbose({
      scope: this.logScope,
      message: 'Initializating WebSocket API',
      data: this.settings,
    })
    this.socket = new WebSocketServer({ noServer: true })
    this.injector = parentInjector.createChild({ owner: this })
    this.socket.on('connection', (websocket, msg) => {
      this.logger.verbose({
        scope: this.logScope,
        message: 'Client connected to WebSocket',
        data: {
          url: msg.url,
          remoteAddress: msg.socket.remoteAddress,
        },
      })
      websocket.on('message', message => {
        this.logger.verbose({
          scope: this.logScope,
          message: 'Client Message received',
          data: {
            message,
          },
        })
        this.execute(message, msg, websocket)
      })

      websocket.on('close', () => {
        this.logger.verbose({
          scope: this.logScope,
          message: 'Client disconnected',
          data: {
            address: msg.connection.address,
          },
        })
      })
    })

    for (const server of this.serverManager.getServers()) {
      server.on('upgrade', (request, socket, head) => {
        const pathname = parse(request.url).pathname
        if (pathname === this.settings.path) {
          this.socket.handleUpgrade(request, socket, head, websocket => {
            this.logger.verbose({
              scope: this.logScope,
              message: `Client connected to socket at '${this.settings.path}'.`,
            })
            this.socket.emit('connection', websocket, request)
          })
        }
      })
    }
  }

  public execute(data: Data, msg: IncomingMessage, websocket: ws) {
    const action = this.settings.actions.find(a => a.canExecute(data))
    if (action) {
      usingAsync(this.injector.createChild({ owner: msg }), async i => {
        i.setExplicitInstance(msg, IncomingMessage)
        i.setExplicitInstance(websocket, ws)
        const actionInstance = i.getInstance<IWebSocketAction>(action)
        actionInstance.execute(data)
      })
    }
  }
}

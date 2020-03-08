import { Injectable, Injector } from '@furystack/inject'
import { Disposable, ObservableValue } from '@furystack/utils'
import { Server, createServer } from 'http'
import Semaphore from 'semaphore-async-await'
import { IncomingMessage, ServerResponse } from 'http'
import { ScopedLogger } from '@furystack/logging'
import { Socket } from 'net'

export interface ServerOptions {
  hostName?: string
  port: number
}

export interface OnRequest {
  req: IncomingMessage
  res: ServerResponse
}

export interface ServerRecord {
  server: Server
  listener: ObservableValue<OnRequest>
}

@Injectable({ lifetime: 'singleton' })
export class ServerManager implements Disposable {
  public servers = new Map<string, ServerRecord>()
  private openedSockets = new Set<Socket>()

  private readonly listenLock = new Semaphore(1)

  private getHostUrl = (options: ServerOptions) => `http://${options.hostName || 'localhost'}:${options.port}`

  private onConnection = (socket: Socket) => {
    this.openedSockets.add(socket)
    socket.once('close', () => this.openedSockets.delete(socket))
  }

  public async dispose() {
    await Promise.all(
      [...this.servers.values()].map(
        s =>
          new Promise((resolve, reject) => {
            s.server.close(err => (err ? reject(err) : resolve()))
            s.server.off('connection', this.onConnection)
          }),
      ),
    )

    this.openedSockets.forEach(s => s.destroy())
  }

  public async getOrCreate(options: ServerOptions): Promise<ServerRecord> {
    const url = this.getHostUrl(options)
    if (!this.servers.has(url)) {
      await this.listenLock.acquire()
      if (!this.servers.has(url)) {
        try {
          await new Promise((resolve, reject) => {
            const listener = new ObservableValue<OnRequest>()
            const server = createServer((req, res) => {
              listener.setValue({ req, res })
            })
            server.on('connection', this.onConnection)
            server
              .listen(options.port, options.hostName)
              .on('listening', () => resolve())
              .on('error', err => reject(err))
            this.servers.set(url, { server, listener })
          })
        } catch (error) {
          this.logger.error({
            message: `There was an error during server creation at ${url}`,
            data: { error, url, options },
          })
          throw error
        }
      }
      this.listenLock.release()
    }
    return this.servers.get(url) as ServerRecord
  }

  private logger: ScopedLogger

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/rest-service/server-manager')
  }
}

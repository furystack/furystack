import { Injectable } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import { Server, createServer } from 'http'
import Semaphore from 'semaphore-async-await'
import { IncomingMessage, ServerResponse } from 'http'
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
  apis: Array<{ shouldExec: (options: OnRequest) => boolean; onRequest: (options: OnRequest) => void }>
}

@Injectable({ lifetime: 'singleton' })
export class ServerManager implements Disposable {
  public static DEFAULT_HOST = 'localhost'

  public servers = new Map<string, ServerRecord>()
  private openedSockets = new Set<Socket>()

  private readonly listenLock = new Semaphore(1)

  private getHostUrl = (options: ServerOptions) =>
    `http://${options.hostName || ServerManager.DEFAULT_HOST}:${options.port}`

  private onConnection = (socket: Socket) => {
    this.openedSockets.add(socket)
    socket.once('close', () => this.openedSockets.delete(socket))
  }

  public async dispose() {
    await this.listenLock.acquire()
    this.openedSockets.forEach((s) => s.destroy())
    await Promise.allSettled(
      [...this.servers.values()].map(
        (s) =>
          new Promise<void>((resolve, reject) => {
            s.server.close((err) => (err ? reject(err) : resolve()))
            s.server.off('connection', this.onConnection)
          }),
      ),
    )
    this.servers.clear()
    this.listenLock.release()
  }

  public async getOrCreate(options: ServerOptions): Promise<ServerRecord> {
    const url = this.getHostUrl(options)
    if (!this.servers.has(url)) {
      await this.listenLock.acquire()
      if (!this.servers.has(url)) {
        await new Promise<void>((resolve, reject) => {
          const apis: ServerRecord['apis'] = []
          const server = createServer((req, res) => {
            const apiMatch = apis.find((api) => api.shouldExec({ req, res }))
            if (apiMatch) {
              apiMatch.onRequest({ req, res })
            } else {
              res.destroy()
            }
          })
          server.on('connection', this.onConnection)
          server
            .listen(options.port, options.hostName)
            .on('listening', () => resolve())
            .on('error', (err) => reject(err))
          this.servers.set(url, { server, apis })
        })
      }
      this.listenLock.release()
    }
    return this.servers.get(url) as ServerRecord
  }
}

import { Injectable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { createServer } from 'http'
import type { Socket } from 'net'
import { Lock } from 'semaphore-async-await'

export interface ServerOptions {
  hostName?: string
  port: number
}

export interface OnRequest {
  req: IncomingMessage
  res: ServerResponse
}

export interface ServerApi {
  shouldExec: (options: OnRequest) => boolean
  onRequest: (options: OnRequest) => Promise<void>
}

export interface ServerRecord {
  server: Server
  apis: ServerApi[]
}

@Injectable({ lifetime: 'singleton' })
export class ServerManager
  extends EventHub<{ onRequestFailed: [unknown, IncomingMessage, ServerResponse<IncomingMessage>] }>
  implements AsyncDisposable
{
  public static DEFAULT_HOST = 'localhost'
  public servers = new Map<string, ServerRecord>()
  private openedSockets = new Set<Socket>()
  private readonly listenLock = new Lock()
  private getHostUrl = (options: ServerOptions) =>
    `http://${options.hostName || ServerManager.DEFAULT_HOST}:${options.port}`

  private onConnection = (socket: Socket) => {
    this.openedSockets.add(socket)
    socket.once('close', () => this.openedSockets.delete(socket))
  }
  public async [Symbol.asyncDispose]() {
    try {
      await this.listenLock.waitFor(5000)
    } finally {
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
  }

  public async getOrCreate(options: ServerOptions): Promise<ServerRecord> {
    const url = this.getHostUrl(options)
    if (!this.servers.has(url)) {
      await this.listenLock.acquire()
      try {
        if (!this.servers.has(url)) {
          await new Promise<void>((resolve, reject) => {
            const apis: ServerRecord['apis'] = []
            const server = createServer((req, res) => {
              const apiMatch = apis.find((api) => api.shouldExec({ req, res }))
              if (apiMatch) {
                apiMatch.onRequest({ req, res }).catch((error) => {
                  this.emit('onRequestFailed', [error, req, res])
                })
              } else {
                res.destroy()
              }
            })
            server.on('connection', this.onConnection)
            server.on('listening', () => resolve())
            server.on('error', (err) => reject(err))
            server.listen(options.port, options.hostName)
            this.servers.set(url, { server, apis })
          })
        }
      } finally {
        this.listenLock.release()
      }
    }
    return this.servers.get(url) as ServerRecord
  }
}

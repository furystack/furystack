import { Injectable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { createServer } from 'http'
import type { Socket } from 'net'
import type { Duplex } from 'stream'

export interface ServerOptions {
  hostName?: string
  port: number
}

export interface OnRequest {
  req: IncomingMessage
  res: ServerResponse
}

export interface OnUpgrade {
  req: IncomingMessage
  socket: Duplex
  head: Buffer
}

export interface ServerApi {
  shouldExec: (options: OnRequest) => boolean
  onRequest: (options: OnRequest) => Promise<void>
  onUpgrade?: (options: OnUpgrade) => Promise<void>
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
  private readonly pendingCreates = new Map<string, Promise<ServerRecord>>()
  private getHostUrl = (options: ServerOptions) =>
    `http://${options.hostName || ServerManager.DEFAULT_HOST}:${options.port}`

  private onConnection = (socket: Socket) => {
    this.openedSockets.add(socket)
    socket.once('close', () => this.openedSockets.delete(socket))
  }
  public async [Symbol.asyncDispose]() {
    await Promise.allSettled([...this.pendingCreates.values()])
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
    super[Symbol.dispose]?.()
  }

  public async getOrCreate(options: ServerOptions): Promise<ServerRecord> {
    const url = this.getHostUrl(options)

    const existing = this.servers.get(url)
    if (existing) {
      return existing
    }

    const pending = this.pendingCreates.get(url)
    if (pending) {
      return pending
    }

    const createPromise = this.createServer(url, options)
    this.pendingCreates.set(url, createPromise)
    return createPromise
  }

  private async createServer(url: string, options: ServerOptions): Promise<ServerRecord> {
    try {
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
        server.on('upgrade', (req, socket, head) => {
          const apiMatch = apis.find((api) => api.shouldExec({ req, res: {} as ServerResponse }))
          if (apiMatch?.onUpgrade) {
            apiMatch.onUpgrade({ req, socket, head }).catch((error) => {
              this.emit('onRequestFailed', [error, req, {} as ServerResponse])
              socket.destroy()
            })
          } else {
            socket.destroy()
          }
        })
        server.on('connection', this.onConnection)
        server.on('listening', () => resolve())
        server.on('error', (err) => reject(err))
        server.listen(options.port, options.hostName)
        this.servers.set(url, { server, apis })
      })
      return this.servers.get(url) as ServerRecord
    } finally {
      this.pendingCreates.delete(url)
    }
  }
}

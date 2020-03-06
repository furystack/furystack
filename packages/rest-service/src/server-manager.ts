import { Injectable } from '@furystack/inject'
import { Disposable, ObservableValue } from '@furystack/utils'
import { Server, createServer } from 'http'
import Semaphore from 'semaphore-async-await'
import { IncomingMessage } from 'http'
import { ServerResponse } from 'http'

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

  private readonly listenLock = new Semaphore(1)

  private getHostUrl = (options: ServerOptions) => `http://${options.hostName || 'localhost'}:${options.port}`

  public async dispose() {
    await Promise.all(
      [...this.servers.values()].map(
        s => new Promise((resolve, reject) => s.server.close(err => (err ? reject(err) : resolve()))),
      ),
    )
  }

  public async getOrCreate(options: ServerOptions): Promise<ServerRecord> {
    const url = this.getHostUrl(options)
    if (!this.servers.has(url)) {
      await this.listenLock.acquire()
      if (!this.servers.has(url)) {
        try {
          const listener = new ObservableValue<OnRequest>()
          const server = createServer((req, res) => {
            listener.setValue({ req, res })
          })
          await new Promise((resolve, reject) =>
            server
              .listen(options.port, options.hostName)
              .on('listening', () => resolve())
              .on('error', err => reject(err)),
          )
          this.servers.set(url, { server, listener })
        } finally {
          this.listenLock.release()
        }
      }
    }
    return this.servers.get(url) as ServerRecord
  }
}

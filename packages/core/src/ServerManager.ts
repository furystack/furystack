import { Server } from 'net'
import { Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import { ScopedLogger } from '@furystack/logging'

/**
 * Manager class for server instances
 */
@Injectable({ lifetime: 'scoped' })
export class ServerManager implements Disposable {
  private readonly servers: Set<Server> = new Set()

  public async dispose() {
    this.logger.information({ message: `Disposing servers...` })
    for (const server of this.servers.values()) {
      const serverAddress = server.address()
      try {
        await new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
        this.logger.information({
          message: `Server '${JSON.stringify(serverAddress)}' disposed`,
        })
      } catch (error) {
        this.logger.error({
          message: `Failed to dispose server '${serverAddress}'.`,
        })
      }
    }
    this.servers.clear()
  }

  /**
   * Returns a collection of servers
   */
  public getServers() {
    return this.servers.values()
  }

  /**
   * Adds a new server to a set
   * @param server The server to add
   */
  public set(server: Server) {
    this.servers.add(server)
  }

  private readonly logger: ScopedLogger

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/core/server-manager')
  }
}

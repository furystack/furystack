import { Server } from 'net'
import { Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@sensenet/client-utils'

/**
 * Manager class for server instances
 */
@Injectable({ lifetime: 'scoped' })
export class ServerManager implements Disposable {
  private readonly servers: Set<Server> = new Set()

  public async dispose() {
    this.injector.logger.information({ scope: 'ServerManager', message: `Disposing servers...` })
    for (const server of this.servers.values()) {
      const serverAddress = server.address()
      try {
        await new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())))
        this.injector.logger.information({
          scope: 'ServerManager',
          message: `Server '${JSON.stringify(serverAddress)}' disposed`,
        })
      } catch (error) {
        this.injector.logger.error({
          scope: 'ServerManager',
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

  constructor(private injector: Injector) {}
}

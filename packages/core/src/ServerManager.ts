import { Server } from 'net'
import { Injectable } from '@furystack/inject'

/**
 * Manager class for server instances
 */
@Injectable({ lifetime: 'scoped' })
export class ServerManager {
  private readonly servers: Set<Server> = new Set()

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
}

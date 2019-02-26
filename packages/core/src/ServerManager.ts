import { Injectable } from '@furystack/inject'
import { Server } from 'net'

/**
 * Manager class for server instances
 */
@Injectable()
export class ServerManager {
  private readonly servers: Set<Server> = new Set()

  public getServers() {
    return this.servers.values()
  }

  public set(server: Server) {
    this.servers.add(server)
  }
}

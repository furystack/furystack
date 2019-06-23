import { Disposable } from '@sensenet/client-utils'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { connect, MongoClient, MongoClientOptions } from 'mongodb'
import Semaphore from 'semaphore-async-await'

/**
 * Factory for instantiating MongoDb clients
 */
@Injectable({ lifetime: 'singleton' })
export class MongoClientFactory implements Disposable {
  private connections: Map<string, { client: MongoClient; lock: Semaphore }> = new Map()

  public dispose() {
    for (const connection of this.connections.values()) {
      connection.client.close()
    }
    this.connections.clear()
  }

  public async getClientFor(url: string, options?: MongoClientOptions) {
    const existing = this.connections.get(url)
    if (existing) {
      await existing.lock.acquire()
      existing.lock.release()
      return existing.client as MongoClient
    }

    const lock = new Semaphore(1)
    try {
      await lock.acquire()
      this.connections.set(url, { lock, client: null as any })
      const client = await connect(
        url,
        options,
      )
      this.connections.set(url, { lock, client })
      this.logger.information({ message: `Created MongoDB connection for '${url}'` })
      return client
    } catch (error) {
      this.logger.error({
        message: `Error during initializing MongoDB connection`,
        data: {
          error,
          url,
          options,
        },
      })
      throw error
    } finally {
      lock.release()
    }
  }

  private logger: ScopedLogger
  constructor(injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/mongodb-store')
  }
}

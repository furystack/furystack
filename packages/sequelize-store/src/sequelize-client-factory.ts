import { Disposable } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { Sequelize, Options } from 'sequelize'
import Semaphore from 'semaphore-async-await'

/**
 * Factory for instantiating MongoDb clients
 */
@Injectable({ lifetime: 'singleton' })
export class SequelizeClientFactory implements Disposable {
  private connections: Map<string, Sequelize> = new Map()

  private readonly connectionLock = new Semaphore(1)

  public async dispose() {
    await Promise.all([...this.connections.values()].map((c) => c.close()))
    this.connections.clear()
  }

  public async getSequelizeClient(options: Options, skipSync = false) {
    const key = JSON.stringify(options)
    const existing = this.connections.get(key)
    if (existing) {
      return existing
    }

    try {
      await this.connectionLock.acquire()
      const existingCreated = this.connections.get(key)
      if (existingCreated) {
        return existingCreated
      }
      // const client = await connect(url, options)
      const client = new Sequelize(options)
      this.connections.set(key, client)
      skipSync || (await client.sync())
      return client
    } finally {
      this.connectionLock.release()
    }
  }
}

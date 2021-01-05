import { Disposable } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { connect, MongoClient, MongoClientOptions } from 'mongodb'
import Semaphore from 'semaphore-async-await'

/**
 * Factory for instantiating MongoDb clients
 */
@Injectable({ lifetime: 'singleton' })
export class MongoClientFactory implements Disposable {
  private connections: Map<string, MongoClient> = new Map()

  private readonly connectionLock = new Semaphore(1)

  public async dispose() {
    await Promise.all([...this.connections.values()].map((c) => c.close()))
    this.connections.clear()
  }

  public async getClientFor(url: string, options?: MongoClientOptions) {
    const existing = this.connections.get(url)
    if (existing) {
      return existing
    }

    try {
      await this.connectionLock.acquire()
      const existingCreated = this.connections.get(url)
      if (existingCreated) {
        return existingCreated
      }
      const client = await connect(url, options)
      this.connections.set(url, client)
      return client
    } finally {
      this.connectionLock.release()
    }
  }
}

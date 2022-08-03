import { Disposable } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { MongoClient, MongoClientOptions } from 'mongodb'

/**
 * Factory for instantiating MongoDb clients
 */
@Injectable({ lifetime: 'singleton' })
export class MongoClientFactory implements Disposable {
  private connections: Map<string, MongoClient> = new Map()

  public async dispose() {
    await Promise.all([...this.connections.values()].map((c) => c.close(true)))
    this.connections.clear()
  }

  public async getClientFor(url: string, options?: MongoClientOptions) {
    const existing = this.connections.get(url)
    if (existing) {
      return existing
    }

    const client = new MongoClient(url, options)
    this.connections.set(url, client)
    return client
  }
}

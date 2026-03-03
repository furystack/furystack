import { Injectable } from '@furystack/inject'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import type { MongoClientOptions } from 'mongodb'
import { MongoClient } from 'mongodb'

/**
 * Events emitted by the {@link MongoClientFactory}
 */
export type MongoClientFactoryEvents = {
  onClientCreated: { url: string }
  onDisposed: undefined
  onListenerError: ListenerErrorPayload
}

/**
 * Factory for instantiating MongoDb clients
 */
@Injectable({ lifetime: 'singleton' })
export class MongoClientFactory extends EventHub<MongoClientFactoryEvents> implements AsyncDisposable {
  private connections: Map<string, MongoClient> = new Map()

  public async [Symbol.asyncDispose]() {
    await Promise.all([...this.connections.values()].map((c) => c.close(true)))
    this.connections.clear()
    this.emit('onDisposed', undefined)
    super[Symbol.dispose]()
  }

  public getClientFor(url: string, options?: MongoClientOptions) {
    const existing = this.connections.get(url)
    if (existing) {
      return existing
    }

    const client = new MongoClient(url, options)
    this.connections.set(url, client)
    this.emit('onClientCreated', { url })
    return client
  }
}

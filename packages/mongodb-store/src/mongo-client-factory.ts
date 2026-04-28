import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { MongoClientOptions } from 'mongodb'
import { MongoClient } from 'mongodb'

import type { defineMongoDbStore } from './define-mongodb-store.js'

/**
 * Pools {@link MongoClient} instances by URL so every store that targets the
 * same MongoDB deployment shares a single connection.
 *
 * Application code rarely calls this directly — {@link defineMongoDbStore}
 * resolves the factory token internally. Exported for tests and advanced
 * integrations that need raw client access (e.g. dropping a test database).
 */
export interface MongoClientFactory {
  getClientFor(url: string, options?: MongoClientOptions): MongoClient
}

/**
 * Singleton token for the {@link MongoClientFactory}. Closes every pooled
 * client when the owning injector is disposed.
 */
export const MongoClientFactory: Token<MongoClientFactory, 'singleton'> = defineService({
  name: '@furystack/mongodb-store/MongoClientFactory',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const connections = new Map<string, MongoClient>()
    onDispose(async () => {
      await Promise.all([...connections.values()].map((c) => c.close(true)))
      connections.clear()
    })
    return {
      getClientFor(url: string, options?: MongoClientOptions): MongoClient {
        const existing = connections.get(url)
        if (existing) {
          return existing
        }
        const client = new MongoClient(url, options)
        connections.set(url, client)
        return client
      },
    }
  },
})

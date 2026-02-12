import { addStore, InMemoryStore, User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { DefaultSession, useHttpAuthentication, useRestService, ServerManager } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { useWebsockets } from '@furystack/websocket-api'
import { describe, expect, it } from 'vitest'
import { WebSocket } from 'ws'
import type { ClientSyncMessage, ServerSyncMessage } from '@furystack/entity-sync'
import { SubscriptionManager } from './subscription-manager.js'
import { SyncSubscribeAction } from './sync-subscribe-action.js'
import { SyncUnsubscribeAction } from './sync-unsubscribe-action.js'
import { useEntitySync } from './use-entity-sync.js'

class TestEntity {
  declare id: string
  declare name: string
}

describe('Entity Sync Integration tests', () => {
  const host = 'localhost'
  const wsPath = '/sync'

  const setupServer = async () => {
    const injector = new Injector()
    const port = getPort()
    const createdClients: WebSocket[] = []

    await useRestService({
      injector,
      api: {},
      root: '',
      port,
      hostName: host,
    })

    addStore(injector, new InMemoryStore({ model: User, primaryKey: 'username' })).addStore(
      new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' }),
    )
    useHttpAuthentication(injector, {})

    addStore(injector, new InMemoryStore({ model: TestEntity, primaryKey: 'id' }))
    injector.getInstance(Repository).createDataSet(TestEntity, 'id')

    await useWebsockets(injector, {
      actions: [SyncSubscribeAction, SyncUnsubscribeAction],
      path: wsPath,
      port,
      host,
    })

    useEntitySync(injector, {
      models: [{ model: TestEntity, primaryKey: 'id' }],
    })

    const createClient = async (): Promise<WebSocket> => {
      return new Promise<WebSocket>((resolve, reject) => {
        injector
          .getInstance(ServerManager)
          .getOrCreate({ port })
          .then(() => {
            const ws = new WebSocket(`ws://${host}:${port}${wsPath}`)
            createdClients.push(ws)
            ws.on('open', () => resolve(ws)).on('error', reject)
          })
          .catch(reject)
      })
    }

    const dataSet = injector.getInstance(Repository).getDataSetFor(TestEntity, 'id')
    const manager = injector.getInstance(SubscriptionManager)

    return {
      injector,
      dataSet,
      manager,
      createClient,
      createdClients,
      [Symbol.asyncDispose]: async () => {
        createdClients.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close()
          }
        })
        createdClients.length = 0
        await injector[Symbol.asyncDispose]()
      },
    }
  }

  const sendAndReceive = (client: WebSocket, message: ClientSyncMessage): Promise<ServerSyncMessage> => {
    return new Promise((resolve, reject) => {
      client.once('message', (data: Buffer) => {
        resolve(JSON.parse(data.toString()) as ServerSyncMessage)
      })
      client.once('error', reject)
      client.send(JSON.stringify(message))
    })
  }

  const waitForMessage = (client: WebSocket, timeoutMs = 2000): Promise<ServerSyncMessage> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out waiting for message')), timeoutMs)
      client.once('message', (data: Buffer) => {
        clearTimeout(timer)
        resolve(JSON.parse(data.toString()) as ServerSyncMessage)
      })
      client.once('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
  }

  /** Polls until the condition is met or timeout */
  const waitUntil = async (condition: () => boolean, timeoutMs = 2000, intervalMs = 10): Promise<void> => {
    const start = Date.now()
    while (!condition()) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('waitUntil timed out')
      }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }

  it('should subscribe and receive a snapshot for an existing entity', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const client = await createClient()
      const response = await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      expect(response.type).toBe('subscribed')
      if (response.type === 'subscribed' && response.mode === 'snapshot') {
        expect(response.data).toEqual({ id: '1', name: 'Alice' })
        expect(response.subscriptionId).toBeDefined()
        expect(response.version.seq).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('should subscribe and receive a snapshot with undefined for a non-existent entity', async () => {
    await usingAsync(await setupServer(), async ({ createClient }) => {
      const client = await createClient()
      const response = await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: 'does-not-exist',
      })

      expect(response.type).toBe('subscribed')
      if (response.type === 'subscribed' && response.mode === 'snapshot') {
        expect(response.data).toBeUndefined()
      }
    })
  })

  it('should return subscription-error for an unregistered model', async () => {
    await usingAsync(await setupServer(), async ({ createClient }) => {
      const client = await createClient()
      const response = await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'UnknownModel',
        key: '1',
      })

      expect(response).toMatchObject({
        type: 'subscription-error',
        requestId: 'req-1',
      })
    })
  })

  it('should receive entity-updated notification after a server-side update', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const client = await createClient()
      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      const updatePromise = waitForMessage(client)
      await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

      const notification = await updatePromise
      expect(notification.type).toBe('entity-updated')
      if (notification.type === 'entity-updated') {
        expect(notification.change).toEqual({ name: 'Bob' })
        expect(notification.version.seq).toBeGreaterThan(0)
      }
    })
  })

  it('should receive entity-removed notification after a server-side removal', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const client = await createClient()
      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      const removePromise = waitForMessage(client)
      await dataSet.remove(injector, '1' as TestEntity['id'])

      const notification = await removePromise
      expect(notification.type).toBe('entity-removed')
      if (notification.type === 'entity-removed') {
        expect(notification.id).toBe('1')
      }
    })
  })

  it('should receive entity-added notification when a watched entity is created', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      const client = await createClient()
      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      const addPromise = waitForMessage(client)
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const notification = await addPromise
      expect(notification.type).toBe('entity-added')
      if (notification.type === 'entity-added') {
        expect(notification.entity).toEqual({ id: '1', name: 'Alice' })
      }
    })
  })

  it('should stop receiving notifications after unsubscribe', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, manager, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const client = await createClient()
      const subscribeResponse = await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      const subsAfterSubscribe = manager.getActiveSubscriptions()

      // Unsubscribe all subscriptions for this entity
      for (const sub of subsAfterSubscribe) {
        if (sub.modelName === 'TestEntity' && sub.key === '1') {
          manager.unsubscribe(sub.subscriptionId)
        }
      }

      expect(
        manager.getActiveSubscriptions().filter((s) => s.modelName === 'TestEntity' && s.key === '1'),
      ).toHaveLength(0)

      await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

      await expect(waitForMessage(client, 200)).rejects.toThrow('Timed out')

      // Verify the subscribe response was valid
      expect(subscribeResponse.type).toBe('subscribed')
    })
  })

  it('should notify multiple clients independently', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)
      await dataSet.add(injector, { id: '2', name: 'Bob' } as TestEntity)

      const client1 = await createClient()
      const client2 = await createClient()

      await sendAndReceive(client1, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      await sendAndReceive(client2, {
        type: 'subscribe-entity',
        requestId: 'req-2',
        model: 'TestEntity',
        key: '2',
      })

      const update1Promise = waitForMessage(client1)
      await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Alice Updated' } as Partial<TestEntity>)

      const notification1 = await update1Promise
      expect(notification1.type).toBe('entity-updated')

      await expect(waitForMessage(client2, 200)).rejects.toThrow('Timed out')
    })
  })

  it('should support multiple subscriptions from a single client', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)
      await dataSet.add(injector, { id: '2', name: 'Bob' } as TestEntity)

      const client = await createClient()

      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-2',
        model: 'TestEntity',
        key: '2',
      })

      const update1Promise = waitForMessage(client)
      await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Alice Updated' } as Partial<TestEntity>)
      const notification1 = await update1Promise
      expect(notification1.type).toBe('entity-updated')
      if (notification1.type === 'entity-updated') {
        expect(notification1.change).toEqual({ name: 'Alice Updated' })
      }

      const update2Promise = waitForMessage(client)
      await dataSet.update(injector, '2' as TestEntity['id'], { name: 'Bob Updated' } as Partial<TestEntity>)
      const notification2 = await update2Promise
      expect(notification2.type).toBe('entity-updated')
      if (notification2.type === 'entity-updated') {
        expect(notification2.change).toEqual({ name: 'Bob Updated' })
      }
    })
  })

  it('should support delta sync with lastSeq', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)
      await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

      const client = await createClient()
      const response = await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
        lastSeq: 0,
      })

      expect(response.type).toBe('subscribed')
      if (response.type === 'subscribed' && response.mode === 'delta') {
        expect(response.changes.length).toBeGreaterThanOrEqual(1)
        expect(response.version.seq).toBeGreaterThanOrEqual(2)
      }
    })
  })

  it('should clean up subscriptions when a client disconnects', async () => {
    await usingAsync(await setupServer(), async ({ injector, dataSet, manager, createClient }) => {
      await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

      const countBeforeSubscribe = manager.activeSubscriptionCount

      const client = await createClient()
      await sendAndReceive(client, {
        type: 'subscribe-entity',
        requestId: 'req-1',
        model: 'TestEntity',
        key: '1',
      })

      expect(manager.activeSubscriptionCount).toBeGreaterThan(countBeforeSubscribe)

      await new Promise<void>((resolve) => {
        client.on('close', () => resolve())
        client.close()
      })

      await waitUntil(() => manager.activeSubscriptionCount === countBeforeSubscribe)

      expect(manager.activeSubscriptionCount).toBe(countBeforeSubscribe)
    })
  })
})

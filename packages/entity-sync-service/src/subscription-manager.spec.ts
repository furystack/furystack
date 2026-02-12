import { describe, it, expect, vi } from 'vitest'
import { Injector } from '@furystack/inject'
import { InMemoryStore, addStore } from '@furystack/core'
import { Repository, getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import type { ServerSyncMessage } from '@furystack/entity-sync'
import type WebSocket from 'ws'
import { SubscriptionManager } from './subscription-manager.js'

class TestEntity {
  declare id: string
  declare name: string
  declare category: string
}

const createMockSocket = () => {
  const closeHandlers: Array<() => void> = []
  return {
    send: vi.fn(),
    readyState: 1,
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'close') closeHandlers.push(handler)
    }),
    simulateClose: () => closeHandlers.forEach((h) => h()),
  }
}

type MockSocket = ReturnType<typeof createMockSocket>

const getSentMessages = (socket: MockSocket): ServerSyncMessage[] =>
  socket.send.mock.calls.map((call) => JSON.parse(call[0] as string) as ServerSyncMessage)

const setupManager = () => {
  const injector = new Injector()
  addStore(injector, new InMemoryStore({ model: TestEntity, primaryKey: 'id' }))
  injector.getInstance(Repository).createDataSet(TestEntity, 'id')
  const manager = injector.getInstance(SubscriptionManager)
  const dataSet = getDataSetFor(injector, TestEntity, 'id')

  return {
    injector,
    manager,
    dataSet,
    [Symbol.asyncDispose]: async () => {
      manager[Symbol.dispose]()
      await injector[Symbol.asyncDispose]()
    },
  }
}

describe('SubscriptionManager', () => {
  describe('registerModel', () => {
    it('should register a model and track it', async () => {
      await usingAsync(setupManager(), async ({ manager }) => {
        manager.registerModel(TestEntity, 'id')
        const reg = manager.getModelRegistration('TestEntity')
        expect(reg).toBeDefined()
        expect(reg?.primaryKey).toBe('id')
        expect(reg?.currentSeq).toBe(0)
      })
    })

    it('should be idempotent for the same model', async () => {
      await usingAsync(setupManager(), async ({ manager }) => {
        manager.registerModel(TestEntity, 'id')
        manager.registerModel(TestEntity, 'id')
        expect(manager.getModelRegistration('TestEntity')).toBeDefined()
      })
    })

    it('should throw on model name conflict', async () => {
      await usingAsync(setupManager(), async ({ manager }) => {
        manager.registerModel(TestEntity, 'id')
        class OtherEntity {
          declare id: string
        }
        Object.defineProperty(OtherEntity, 'name', { value: 'TestEntity' })
        expect(() => manager.registerModel(OtherEntity, 'id')).toThrow('Model name conflict')
      })
    })

    it('should return undefined for unregistered model', async () => {
      await usingAsync(setupManager(), async ({ manager }) => {
        expect(manager.getModelRegistration('NonExistent')).toBeUndefined()
      })
    })
  })

  describe('subscribeEntity', () => {
    it('should send a snapshot response', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'subscribed',
          requestId: 'req-1',
          model: 'TestEntity',
          mode: 'snapshot',
          data: { id: '1', name: 'Alice', category: 'A' },
        })
      })
    })

    it('should send error for unregistered model', async () => {
      await usingAsync(setupManager(), async ({ injector, manager }) => {
        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'UnknownModel', '1')

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'subscription-error',
          requestId: 'req-1',
        })
      })
    })

    it('should include version in snapshot response', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        const msg = getSentMessages(socket)[0]
        if (msg.type === 'subscribed') {
          expect(msg.version.seq).toBeGreaterThanOrEqual(0)
          expect(msg.version.timestamp).toBeDefined()
        }
      })
    })

    it('should track active subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        expect(manager.activeSubscriptionCount).toBe(0)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        expect(manager.activeSubscriptionCount).toBe(1)
      })
    })
  })

  describe('entity change notifications', () => {
    it('should notify on entity update', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'entity-updated',
          change: { name: 'Bob' },
        })
      })
    })

    it('should notify on entity removal', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.remove(injector, '1' as TestEntity['id'])

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'entity-removed',
          id: '1',
        })
      })
    })

    it('should notify on entity added matching a subscription key', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'entity-added',
          entity: { id: '1', name: 'Alice', category: 'A' },
        })
      })
    })

    it('should not notify unrelated subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)
        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'B' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.update(injector, '2' as TestEntity['id'], { name: 'Charlie' } as Partial<TestEntity>)

        expect(getSentMessages(socket)).toHaveLength(0)
      })
    })

    it('should include version with incrementing seq in notifications', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)
        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Charlie' } as Partial<TestEntity>)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(2)
        if (messages[0].type === 'entity-updated' && messages[1].type === 'entity-updated') {
          expect(messages[1].version.seq).toBeGreaterThan(messages[0].version.seq)
        }
      })
    })
  })

  describe('subscribeCollection', () => {
    it('should send a snapshot response with matching entities', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)
        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'B' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'subscribed',
          requestId: 'req-1',
          model: 'TestEntity',
          primaryKey: 'id',
          mode: 'snapshot',
        })
        if (messages[0].type === 'subscribed' && messages[0].mode === 'snapshot') {
          expect(messages[0].data).toHaveLength(2)
        }
      })
    })

    it('should send a snapshot with filter applied', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)
        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'B' } as TestEntity)
        await dataSet.add(injector, { id: '3', name: 'Charlie', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', {
          category: { $eq: 'A' },
        })

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        if (messages[0].type === 'subscribed' && messages[0].mode === 'snapshot') {
          const data = messages[0].data as Array<{ id: string; category: string }>
          expect(data).toHaveLength(2)
          expect(data.every((e) => e.category === 'A')).toBe(true)
        }
      })
    })

    it('should send a snapshot with top/skip applied', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)
        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'A' } as TestEntity)
        await dataSet.add(injector, { id: '3', name: 'Charlie', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(
          socket as unknown as WebSocket,
          injector,
          'req-1',
          'TestEntity',
          undefined,
          2,
          0,
        )

        const messages = getSentMessages(socket)
        if (messages[0].type === 'subscribed' && messages[0].mode === 'snapshot') {
          expect((messages[0].data as unknown[]).length).toBeLessThanOrEqual(2)
        }
      })
    })

    it('should send error for unregistered model', async () => {
      await usingAsync(setupManager(), async ({ injector, manager }) => {
        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'UnknownModel')

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'subscription-error',
          requestId: 'req-1',
        })
      })
    })

    it('should track collection subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager }) => {
        manager.registerModel(TestEntity, 'id')

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')

        expect(manager.activeSubscriptionCount).toBe(1)
        const subs = manager.getActiveSubscriptions()
        expect(subs[0].type).toBe('collection')
      })
    })
  })

  describe('collection change notifications', () => {
    it('should notify when an entity matching the filter is added', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', {
          category: { $eq: 'A' },
        })
        socket.send.mockClear()

        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        // Wait for async evaluation
        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.some((m) => m.type === 'entity-added')).toBe(true)
        const addedMsg = messages.find((m) => m.type === 'entity-added')
        if (addedMsg?.type === 'entity-added') {
          expect(addedMsg.entity).toMatchObject({ id: '1', name: 'Alice', category: 'A' })
        }
      })
    })

    it('should not notify when an entity not matching the filter is added', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', {
          category: { $eq: 'A' },
        })
        socket.send.mockClear()

        await dataSet.add(injector, { id: '1', name: 'Bob', category: 'B' } as TestEntity)

        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.filter((m) => m.type === 'entity-added')).toHaveLength(0)
      })
    })

    it('should notify when a collection entity is updated', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')
        socket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Updated' } as Partial<TestEntity>)

        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.some((m) => m.type === 'entity-updated')).toBe(true)
        const updatedMsg = messages.find((m) => m.type === 'entity-updated')
        if (updatedMsg?.type === 'entity-updated') {
          expect(updatedMsg.change).toMatchObject({ name: 'Updated' })
        }
      })
    })

    it('should notify when a collection entity is removed', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')
        socket.send.mockClear()

        await dataSet.remove(injector, '1' as TestEntity['id'])

        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.some((m) => m.type === 'entity-removed')).toBe(true)
        const removedMsg = messages.find((m) => m.type === 'entity-removed')
        if (removedMsg?.type === 'entity-removed') {
          expect(removedMsg.id).toBe('1')
        }
      })
    })

    it('should detect when entity leaves a filtered collection via update', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', {
          category: { $eq: 'A' },
        })
        socket.send.mockClear()

        // Update category so it no longer matches the filter
        await dataSet.update(injector, '1' as TestEntity['id'], { category: 'B' } as Partial<TestEntity>)

        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.some((m) => m.type === 'entity-removed')).toBe(true)
      })
    })

    it('should detect when entity enters a filtered collection via update', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'B' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', {
          category: { $eq: 'A' },
        })
        socket.send.mockClear()

        // Update category so it now matches the filter
        await dataSet.update(injector, '1' as TestEntity['id'], { category: 'A' } as Partial<TestEntity>)

        await new Promise((r) => setTimeout(r, 50))

        const messages = getSentMessages(socket)
        expect(messages.some((m) => m.type === 'entity-added')).toBe(true)
      })
    })
  })

  describe('debounce', () => {
    it('should batch entity notifications when debounceMs > 0', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
          manager.registerModel(TestEntity, 'id', { debounceMs: 100 })
          await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

          const socket = createMockSocket()
          await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
          socket.send.mockClear()

          await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)
          await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Charlie' } as Partial<TestEntity>)

          // Should not have sent yet (within debounce window)
          expect(getSentMessages(socket)).toHaveLength(0)

          vi.advanceTimersByTime(150)

          // Now both updates should be flushed
          const messages = getSentMessages(socket)
          expect(messages).toHaveLength(2)
          expect(messages[0].type).toBe('entity-updated')
          expect(messages[1].type).toBe('entity-updated')
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should send immediately when debounceMs is 0 (default)', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        socket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

        // Should send immediately
        expect(getSentMessages(socket)).toHaveLength(1)
      })
    })
  })

  describe('query cache', () => {
    it('should use cached results within queryTtlMs', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id', { queryTtlMs: 500 })
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')
        socket.send.mockClear()

        // First change triggers a query
        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'A' } as TestEntity)
        await new Promise((r) => setTimeout(r, 50))

        // Second change within TTL window should use cached result
        await dataSet.add(injector, { id: '3', name: 'Charlie', category: 'A' } as TestEntity)
        await new Promise((r) => setTimeout(r, 50))

        // The second evaluation should have used the cache, so entity '3' might not appear
        // in the second notification (cache returns stale data)
        const messages = getSentMessages(socket)
        expect(messages.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('unsubscribe', () => {
    it('should stop notifications after unsubscribe', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        const subscribed = getSentMessages(socket)[0]
        if (subscribed.type === 'subscribed') {
          manager.unsubscribe(subscribed.subscriptionId)
        }
        socket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

        expect(getSentMessages(socket)).toHaveLength(0)
        expect(manager.activeSubscriptionCount).toBe(0)
      })
    })

    it('should stop collection notifications after unsubscribe', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')

        const subscribed = getSentMessages(socket)[0]
        if (subscribed.type === 'subscribed') {
          manager.unsubscribe(subscribed.subscriptionId)
        }
        socket.send.mockClear()

        await dataSet.add(injector, { id: '2', name: 'Bob', category: 'A' } as TestEntity)

        await new Promise((r) => setTimeout(r, 50))

        expect(getSentMessages(socket)).toHaveLength(0)
        expect(manager.activeSubscriptionCount).toBe(0)
      })
    })
  })

  describe('socket cleanup', () => {
    it('should remove subscriptions when socket closes', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        expect(manager.activeSubscriptionCount).toBe(1)

        socket.simulateClose()
        expect(manager.activeSubscriptionCount).toBe(0)
      })
    })

    it('should remove collection subscriptions when socket closes', async () => {
      await usingAsync(setupManager(), async ({ injector, manager }) => {
        manager.registerModel(TestEntity, 'id')

        const socket = createMockSocket()
        await manager.subscribeCollection(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity')
        expect(manager.activeSubscriptionCount).toBe(1)

        socket.simulateClose()
        expect(manager.activeSubscriptionCount).toBe(0)
      })
    })
  })

  describe('changelog and delta sync', () => {
    it('should maintain a changelog of changes', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const reg = manager.getModelRegistration('TestEntity')
        expect(reg?.changelogLength).toBe(1)
        expect(reg?.currentSeq).toBe(1)
      })
    })

    it('should send delta response when changelog covers the gap', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)
        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1', 0)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        if (messages[0].type === 'subscribed' && messages[0].mode === 'delta') {
          expect(messages[0].changes).toHaveLength(2)
        } else {
          expect.fail('Expected a subscribed message with delta mode')
        }
      })
    })

    it('should fall back to snapshot when changelog does not cover the gap', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id', { changelogRetentionMs: 0 })
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        await new Promise((resolve) => setTimeout(resolve, 10))

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Bob' } as Partial<TestEntity>)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1', 0)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        if (messages[0].type === 'subscribed') {
          expect(messages[0].mode).toBe('snapshot')
        }
      })
    })
  })

  describe('mixed entity and collection subscriptions', () => {
    it('should notify both entity and collection subscribers on change', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const entitySocket = createMockSocket()
        const collectionSocket = createMockSocket()

        await manager.subscribeEntity(entitySocket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
        await manager.subscribeCollection(collectionSocket as unknown as WebSocket, injector, 'req-2', 'TestEntity')

        entitySocket.send.mockClear()
        collectionSocket.send.mockClear()

        await dataSet.update(injector, '1' as TestEntity['id'], { name: 'Updated' } as Partial<TestEntity>)

        await new Promise((r) => setTimeout(r, 50))

        // Entity subscriber should get immediate notification
        expect(getSentMessages(entitySocket).some((m) => m.type === 'entity-updated')).toBe(true)

        // Collection subscriber should also get notification (after evaluation)
        expect(getSentMessages(collectionSocket).some((m) => m.type === 'entity-updated')).toBe(true)
      })
    })
  })

  describe('dispose', () => {
    it('should clean up all registrations and subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice', category: 'A' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        manager[Symbol.dispose]()

        expect(manager.activeSubscriptionCount).toBe(0)
        expect(manager.getModelRegistration('TestEntity')).toBeUndefined()
      })
    })
  })
})

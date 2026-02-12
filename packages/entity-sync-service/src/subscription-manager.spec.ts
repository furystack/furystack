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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'subscribed',
          requestId: 'req-1',
          model: 'TestEntity',
          mode: 'snapshot',
          data: { id: '1', name: 'Alice' },
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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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

        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

        const messages = getSentMessages(socket)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toMatchObject({
          type: 'entity-added',
          entity: { id: '1', name: 'Alice' },
        })
      })
    })

    it('should not notify unrelated subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)
        await dataSet.add(injector, { id: '2', name: 'Bob' } as TestEntity)

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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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

  describe('unsubscribe', () => {
    it('should stop notifications after unsubscribe', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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
  })

  describe('socket cleanup', () => {
    it('should remove subscriptions when socket closes', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')
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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

        const reg = manager.getModelRegistration('TestEntity')
        expect(reg?.changelogLength).toBe(1)
        expect(reg?.currentSeq).toBe(1)
      })
    })

    it('should send delta response when changelog covers the gap', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)
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
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

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

  describe('dispose', () => {
    it('should clean up all registrations and subscriptions', async () => {
      await usingAsync(setupManager(), async ({ injector, manager, dataSet }) => {
        manager.registerModel(TestEntity, 'id')
        await dataSet.add(injector, { id: '1', name: 'Alice' } as TestEntity)

        const socket = createMockSocket()
        await manager.subscribeEntity(socket as unknown as WebSocket, injector, 'req-1', 'TestEntity', '1')

        manager[Symbol.dispose]()

        expect(manager.activeSubscriptionCount).toBe(0)
        expect(manager.getModelRegistration('TestEntity')).toBeUndefined()
      })
    })
  })
})

import { defineStore, InMemoryStore, type StoreToken } from '@furystack/core'
import { CrossNodeBus, InProcessCrossNodeBus, MemoryBroker } from '@furystack/cross-node-bus'
import { createInjector, type Injector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import type { ServerSyncMessage } from '@furystack/entity-sync'
import { describe, expect, it, vi } from 'vitest'
import type WebSocket from 'ws'
import { SubscriptionManager } from './subscription-manager.js'

class TestEntity {
  declare id: string
  declare name: string
}

const TestEntityStore: StoreToken<TestEntity, 'id'> = defineStore({
  name: 'entity-change-bus-integration/TestEntityStore',
  model: TestEntity,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: TestEntity, primaryKey: 'id' }),
})

const TestEntityDataSet: DataSetToken<TestEntity, 'id'> = defineDataSet({
  name: 'entity-change-bus-integration/TestEntityDataSet',
  store: TestEntityStore,
})

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

const sentMessages = (socket: ReturnType<typeof createMockSocket>): ServerSyncMessage[] =>
  socket.send.mock.calls.map((call) => JSON.parse(call[0] as string) as ServerSyncMessage)

type Node = { injector: Injector; manager: SubscriptionManager }

/**
 * Spins up N injectors that share a single {@link MemoryBroker} so each
 * injector behaves like a separate node of the same service. Returns a
 * disposable that tears them all down.
 */
const setupCluster = (nodeCount: number, broker: MemoryBroker) => {
  const nodes: Node[] = []
  for (let i = 0; i < nodeCount; i++) {
    const injector = createInjector()
    injector.bind(CrossNodeBus, () => new InProcessCrossNodeBus({ broker, nodeId: `node-${i}` }))
    const manager = injector.get(SubscriptionManager)
    manager.registerModel(TestEntityDataSet)
    nodes.push({ injector, manager })
  }
  return {
    nodes,
    [Symbol.asyncDispose]: async () => {
      for (const { injector } of nodes.reverse()) {
        await injector[Symbol.asyncDispose]()
      }
    },
  }
}

describe('EntityChangeBus integration (multi-node)', () => {
  it('delivers a remote write to a subscriber on a sibling node', async () => {
    using broker = new MemoryBroker()
    await usingAsync(setupCluster(2, broker), async ({ nodes }) => {
      const [a, b] = nodes
      const dataSetA = a.injector.get(TestEntityDataSet)

      const socketB = createMockSocket()
      await b.manager.subscribeEntity(socketB as unknown as WebSocket, b.injector, 'req-1', 'TestEntity', '1')
      socketB.send.mockClear()

      await dataSetA.add(a.injector, { id: '1', name: 'Alice' })
      // Bus dispatch is synchronous; a microtask flush is enough.
      await Promise.resolve()

      const messages = sentMessages(socketB)
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        type: 'entity-added',
        entity: { id: '1', name: 'Alice' },
      })
    })
  })

  it('triggers per-key entity notifications on every node that hosts a matching subscription', async () => {
    using broker = new MemoryBroker()
    await usingAsync(setupCluster(3, broker), async ({ nodes }) => {
      const [a, b, c] = nodes
      const dataSetA = a.injector.get(TestEntityDataSet)

      const socketB = createMockSocket()
      const socketC = createMockSocket()
      await b.manager.subscribeEntity(socketB as unknown as WebSocket, b.injector, 'req-1', 'TestEntity', '1')
      await c.manager.subscribeEntity(socketC as unknown as WebSocket, c.injector, 'req-2', 'TestEntity', '1')
      socketB.send.mockClear()
      socketC.send.mockClear()

      await dataSetA.add(a.injector, { id: '1', name: 'Alice' })
      await Promise.resolve()

      const fromB = sentMessages(socketB).filter((m) => m.type === 'entity-added')
      const fromC = sentMessages(socketC).filter((m) => m.type === 'entity-added')
      expect(fromB).toHaveLength(1)
      expect(fromC).toHaveLength(1)
    })
  })

  it('delivers each remote message exactly once even if the same publish is observed twice', async () => {
    using broker = new MemoryBroker()
    await usingAsync(setupCluster(2, broker), async ({ nodes }) => {
      const [a, b] = nodes
      const dataSetA = a.injector.get(TestEntityDataSet)

      const socketB = createMockSocket()
      await b.manager.subscribeEntity(socketB as unknown as WebSocket, b.injector, 'req-1', 'TestEntity', '1')
      socketB.send.mockClear()

      await dataSetA.add(a.injector, { id: '1', name: 'Alice' })
      // Re-publish the same payload from A — same originId, same modelName.
      // The broker assigns a fresh seq, so it is NOT dropped (it is a
      // genuine new message, not a retransmit). This test exists to
      // distinguish "happy path" semantics from the dedup behaviour
      // documented in the spec.
      await dataSetA.add(a.injector, { id: '2', name: 'Alice' })
      await Promise.resolve()

      const adds = sentMessages(socketB).filter((m) => m.type === 'entity-added')
      // The entity subscriber filters by key, so only the id='1' add reaches it.
      expect(adds).toHaveLength(1)
    })
  })

  it('serves cross-node delta replay from the shared bus', async () => {
    using broker = new MemoryBroker()
    await usingAsync(setupCluster(2, broker), async ({ nodes }) => {
      const [a, b] = nodes
      const dataSetA = a.injector.get(TestEntityDataSet)

      // A produces three changes targeting key '1'. B has not subscribed yet
      // — when it does subscribe with `lastSeq: '0'`, the gap must come from
      // the shared MemoryBroker (B's process never observed these writes
      // through its own DataSet).
      await dataSetA.add(a.injector, { id: '1', name: 'Alice' })
      await dataSetA.update(a.injector, '1', { name: 'Bob' })
      await dataSetA.update(a.injector, '1', { name: 'Charlie' })
      // Let B's manager process the bus arrivals so its lastSeqByModel is
      // current — otherwise the snapshot version stamped on a delta response
      // would underreport.
      await Promise.resolve()

      const socketB = createMockSocket()
      await b.manager.subscribeEntity(socketB as unknown as WebSocket, b.injector, 'req-1', 'TestEntity', '1', '0')

      const messages = sentMessages(socketB)
      expect(messages).toHaveLength(1)
      const subscribed = messages[0]
      if (subscribed.type === 'subscribed' && subscribed.mode === 'delta') {
        // 1 add + 2 updates, all matching key '1'.
        expect(subscribed.changes).toHaveLength(3)
      } else {
        expect.fail(`Expected delta-mode subscription, got ${JSON.stringify(subscribed)}`)
      }
    })
  })
})

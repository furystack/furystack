import { describe, it, expect, vi } from 'vitest'
import type { ClientSyncMessage, ServerSyncMessage } from '@furystack/entity-sync'
import { createInjector, defineService, type Injector, type Token } from '@furystack/inject'
import type { ObservableValue } from '@furystack/utils'
import { using, usingAsync } from '@furystack/utils'
import { EntitySyncService, type EntitySyncServiceOptions } from './entity-sync-service.js'
import { createSyncHooks, type SyncHookContext } from './shades-hooks.js'

class User {
  declare id: string
  declare name: string
}

class ChatMessage {
  declare id: string
  declare text: string
  declare roomId: string
}

const createMockWebSocket = () => {
  const instance = {
    send: vi.fn(),
    close: vi.fn(),
    readyState: 0 as number,
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    simulateOpen() {
      this.readyState = 1
      this.onopen?.({} as Event)
    },
    simulateMessage(data: ServerSyncMessage) {
      this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
    },
  }
  return instance
}

const createMockContext = (injector: Injector): SyncHookContext => {
  const disposables = new Map<string, Disposable>()
  const disposableDeps = new Map<string, string>()
  const observables = new Map<string, unknown>()

  return {
    injector,
    useDisposable: <T extends Disposable>(key: string, factory: () => T, deps?: readonly unknown[]): T => {
      const existing = disposables.get(key)
      const depsKey = deps !== undefined ? JSON.stringify(deps) : undefined

      if (existing) {
        if (depsKey !== undefined && disposableDeps.get(key) !== depsKey) {
          existing[Symbol.dispose]()
          const created = factory()
          disposables.set(key, created)
          disposableDeps.set(key, depsKey)
          return created
        }
        return existing as T
      }

      const created = factory()
      disposables.set(key, created)
      if (depsKey !== undefined) disposableDeps.set(key, depsKey)
      return created
    },
    useObservable: <T>(key: string, observable: ObservableValue<T>): [T, (v: T) => void] => {
      if (!observables.has(key)) {
        observables.set(key, observable)
      }
      return [observable.getValue(), (v: T) => observable.setValue(v)]
    },
  }
}

/**
 * Test helper that mints a fresh token per test so the in-memory singleton
 * cache doesn't bleed between cases, while still exercising the
 * token-resolution code path that production apps use.
 */
const createSyncToken = (options: EntitySyncServiceOptions): Token<EntitySyncService, 'singleton'> =>
  defineService({
    name: `entity-sync-client/test-token-${Math.random().toString(36).slice(2)}`,
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const service = new EntitySyncService(options)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose runs at scope teardown
      onDispose(() => service[Symbol.dispose]())
      return service
    },
  })

describe('Shades convenience hooks', () => {
  describe('useEntitySync', () => {
    it('should subscribe to an entity and return the current state', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useEntitySync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(User)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        const state = useEntitySync(context, User, '123')
        expect(state.status).toBe('connecting')

        const sentData = JSON.parse(mockWs.send.mock.calls[0][0] as string) as ClientSyncMessage
        const requestId = 'requestId' in sentData ? sentData.requestId : ''
        mockWs.simulateMessage({
          type: 'subscribed',
          requestId,
          subscriptionId: 'sub-1',
          model: 'User',
          mode: 'snapshot',
          data: { id: '123', name: 'John' },
          version: { seq: 1, timestamp: new Date().toISOString() },
        })

        const updatedState = useEntitySync(context, User, '123')
        expect(updatedState.status).toBe('synced')
        if (updatedState.status === 'synced') {
          expect(updatedState.data).toEqual({ id: '123', name: 'John' })
        }
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should return same disposable on repeated calls with same key', async () => {
      const mockWs = createMockWebSocket()
      await usingAsync(createInjector(), async (injector) => {
        const syncToken = createSyncToken({
          wsUrl: 'ws://test',
          createWebSocket: () => mockWs as unknown as WebSocket,
          reconnect: false,
        })
        const { useEntitySync } = createSyncHooks(syncToken)

        using(injector.get(syncToken), (service) => {
          service.registerModel(User)

          const context = createMockContext(injector)
          mockWs.simulateOpen()

          useEntitySync(context, User, '123')
          useEntitySync(context, User, '123')

          expect(mockWs.send).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  describe('useEntitySync with changing key', () => {
    it('should create a new subscription when entity key changes', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useEntitySync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(User)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useEntitySync(context, User, '123')
        expect(mockWs.send).toHaveBeenCalledTimes(1)

        const firstCall = JSON.parse(mockWs.send.mock.calls[0][0] as string) as ClientSyncMessage
        expect('key' in firstCall && firstCall.key).toBe('123')

        useEntitySync(context, User, '456')
        expect(mockWs.send).toHaveBeenCalledTimes(2)

        const secondCall = JSON.parse(mockWs.send.mock.calls[1][0] as string) as ClientSyncMessage
        expect('key' in secondCall && secondCall.key).toBe('456')
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should not create a new subscription when entity key stays the same', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useEntitySync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(User)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useEntitySync(context, User, '123')
        useEntitySync(context, User, '123')
        useEntitySync(context, User, '123')

        expect(mockWs.send).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })
  })

  describe('useCollectionSync', () => {
    it('should subscribe to a collection and return the current state', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        const state = useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        expect(state.status).toBe('connecting')

        const sentData = JSON.parse(mockWs.send.mock.calls[0][0] as string) as ClientSyncMessage
        const requestId = 'requestId' in sentData ? sentData.requestId : ''
        mockWs.simulateMessage({
          type: 'subscribed',
          requestId,
          subscriptionId: 'sub-1',
          model: 'ChatMessage',
          primaryKey: 'id',
          mode: 'snapshot',
          data: [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }],
          totalCount: 1,
          version: { seq: 1, timestamp: new Date().toISOString() },
        })

        const updatedState = useCollectionSync(context, ChatMessage, {
          filter: { roomId: { $eq: 'room-1' } },
        })
        expect(updatedState.status).toBe('synced')
        if (updatedState.status === 'synced') {
          expect(updatedState.data.entries).toHaveLength(1)
          expect(updatedState.data.count).toBe(1)
        }
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should create a new subscription when top/skip changes', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useCollectionSync(context, ChatMessage, { top: 10, skip: 0 })
        expect(mockWs.send).toHaveBeenCalledTimes(1)

        const firstCall = JSON.parse(mockWs.send.mock.calls[0][0] as string) as ClientSyncMessage
        expect('top' in firstCall && firstCall.top).toBe(10)
        expect('skip' in firstCall && firstCall.skip).toBe(0)

        useCollectionSync(context, ChatMessage, { top: 10, skip: 10 })
        expect(mockWs.send).toHaveBeenCalledTimes(2)

        const secondCall = JSON.parse(mockWs.send.mock.calls[1][0] as string) as ClientSyncMessage
        expect('top' in secondCall && secondCall.top).toBe(10)
        expect('skip' in secondCall && secondCall.skip).toBe(10)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should create a new subscription when order changes', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useCollectionSync(context, ChatMessage, { order: { id: 'ASC' } })
        expect(mockWs.send).toHaveBeenCalledTimes(1)

        useCollectionSync(context, ChatMessage, { order: { id: 'DESC' } })
        expect(mockWs.send).toHaveBeenCalledTimes(2)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should not create a new subscription when options stay the same', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useCollectionSync(context, ChatMessage, { top: 10, skip: 0, order: { id: 'ASC' } })
        useCollectionSync(context, ChatMessage, { top: 10, skip: 0, order: { id: 'ASC' } })
        useCollectionSync(context, ChatMessage, { top: 10, skip: 0, order: { id: 'ASC' } })

        expect(mockWs.send).toHaveBeenCalledTimes(1)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should create separate subscriptions for different filters (independent slots)', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-2' } } })

        expect(mockWs.send).toHaveBeenCalledTimes(2)

        useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-2' } } })

        expect(mockWs.send).toHaveBeenCalledTimes(2)
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should show cached data when re-subscribing to previously seen options', async () => {
      const mockWs = createMockWebSocket()
      const injector = createInjector()

      const syncToken = createSyncToken({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
        suspendDelayMs: 0,
      })
      const { useCollectionSync } = createSyncHooks(syncToken)

      const service = injector.get(syncToken)
      service.registerModel(ChatMessage)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        useCollectionSync(context, ChatMessage, { top: 10, skip: 0 })

        const sentData = JSON.parse(mockWs.send.mock.calls[0][0] as string) as ClientSyncMessage
        const requestId = 'requestId' in sentData ? sentData.requestId : ''
        mockWs.simulateMessage({
          type: 'subscribed',
          requestId,
          subscriptionId: 'sub-1',
          model: 'ChatMessage',
          primaryKey: 'id',
          mode: 'snapshot',
          data: [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }],
          version: { seq: 1, timestamp: new Date().toISOString() },
        })

        useCollectionSync(context, ChatMessage, { top: 10, skip: 10 })

        await new Promise((resolve) => setTimeout(resolve, 10))

        const restoredState = useCollectionSync(context, ChatMessage, { top: 10, skip: 0 })
        expect(restoredState.status).toBe('cached')
        if (restoredState.status === 'cached') {
          expect(restoredState.data.entries).toHaveLength(1)
          expect(restoredState.data.entries[0]).toEqual({ id: 'msg-1', text: 'Hello', roomId: 'room-1' })
        }
      } finally {
        await injector[Symbol.asyncDispose]()
      }
    })
  })
})

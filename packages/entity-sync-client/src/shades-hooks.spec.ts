import { describe, it, expect, vi } from 'vitest'
import type { ClientSyncMessage, ServerSyncMessage } from '@furystack/entity-sync'
import { Injector } from '@furystack/inject'
import type { ObservableValue } from '@furystack/utils'
import { EntitySyncService } from './entity-sync-service.js'
import { useEntitySync, useCollectionSync } from './shades-hooks.js'
import type { SyncHookContext } from './shades-hooks.js'

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
  const observables = new Map<string, unknown>()

  return {
    injector,
    useDisposable: <T extends Disposable>(key: string, factory: () => T): T => {
      if (!disposables.has(key)) {
        disposables.set(key, factory())
      }
      return disposables.get(key)! as T
    },
    useObservable: <T>(key: string, observable: ObservableValue<T>): [T, (v: T) => void] => {
      if (!observables.has(key)) {
        observables.set(key, observable)
      }
      return [observable.getValue(), (v: T) => observable.setValue(v)]
    },
  }
}

describe('Shades convenience hooks', () => {
  describe('useEntitySync', () => {
    it('should subscribe to an entity and return the current state', async () => {
      const mockWs = createMockWebSocket()
      const injector = new Injector()

      const service = new EntitySyncService({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      service.registerModel(User)
      injector.setExplicitInstance(service, EntitySyncService)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        const state = useEntitySync(context, User, '123')
        expect(state.status).toBe('connecting')

        // Simulate server response
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

        // Re-call to get updated state (simulating re-render)
        const updatedState = useEntitySync(context, User, '123')
        expect(updatedState.status).toBe('synced')
        if (updatedState.status === 'synced') {
          expect(updatedState.data).toEqual({ id: '123', name: 'John' })
        }
      } finally {
        service[Symbol.dispose]()
        await injector[Symbol.asyncDispose]()
      }
    })

    it('should return same disposable on repeated calls with same key', async () => {
      const mockWs = createMockWebSocket()
      const injector = new Injector()

      const service = new EntitySyncService({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      service.registerModel(User)
      injector.setExplicitInstance(service, EntitySyncService)

      const context = createMockContext(injector)
      mockWs.simulateOpen()

      useEntitySync(context, User, '123')
      useEntitySync(context, User, '123')

      // Should only have created one subscription
      expect(mockWs.send).toHaveBeenCalledTimes(1)

      service[Symbol.dispose]()
      await injector[Symbol.asyncDispose]()
    })
  })

  describe('useCollectionSync', () => {
    it('should subscribe to a collection and return the current state', async () => {
      const mockWs = createMockWebSocket()
      const injector = new Injector()

      const service = new EntitySyncService({
        wsUrl: 'ws://test',
        createWebSocket: () => mockWs as unknown as WebSocket,
        reconnect: false,
      })
      service.registerModel(ChatMessage)
      injector.setExplicitInstance(service, EntitySyncService)

      try {
        const context = createMockContext(injector)
        mockWs.simulateOpen()

        const state = useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        expect(state.status).toBe('connecting')

        // Simulate server response
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

        // Re-call to get updated state
        const updatedState = useCollectionSync(context, ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        expect(updatedState.status).toBe('synced')
        if (updatedState.status === 'synced') {
          expect(updatedState.data).toHaveLength(1)
        }
      } finally {
        service[Symbol.dispose]()
        await injector[Symbol.asyncDispose]()
      }
    })
  })
})

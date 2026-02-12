import { describe, it, expect, vi } from 'vitest'
import { usingAsync } from '@furystack/utils'
import type { ServerSyncMessage, ClientSyncMessage } from '@furystack/entity-sync'
import { EntitySyncService } from './entity-sync-service.js'

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
    simulateError() {
      this.onerror?.({} as Event)
    },
  }
  return instance
}

type MockWebSocket = ReturnType<typeof createMockWebSocket>

const getSentMessages = (ws: MockWebSocket): ClientSyncMessage[] =>
  ws.send.mock.calls.map((call) => JSON.parse(call[0] as string) as ClientSyncMessage)

const setupClient = () => {
  const mockWs = createMockWebSocket()
  const service = new EntitySyncService({
    wsUrl: 'ws://test',
    createWebSocket: () => mockWs as unknown as WebSocket,
  })
  service.registerModel(User)
  service.registerModel(ChatMessage)

  return {
    mockWs,
    service,
    [Symbol.dispose]: () => {
      service[Symbol.dispose]()
    },
  }
}

/** Simulates a successful subscribe-entity handshake and returns the requestId */
const subscribeAndRespond = (mockWs: MockWebSocket, subscriptionId: string, data: unknown) => {
  const sentMsg = getSentMessages(mockWs).at(-1)
  if (sentMsg?.type === 'subscribe-entity') {
    mockWs.simulateMessage({
      type: 'subscribed',
      requestId: sentMsg.requestId,
      subscriptionId,
      model: 'User',
      mode: 'snapshot',
      data,
      version: { seq: 1, timestamp: new Date().toISOString() },
    })
  }
}

/** Simulates a successful subscribe-collection handshake */
const subscribeCollectionAndRespond = (
  mockWs: MockWebSocket,
  subscriptionId: string,
  data: unknown[],
  primaryKey: string,
  model = 'ChatMessage',
) => {
  const sentMsg = getSentMessages(mockWs).at(-1)
  if (sentMsg?.type === 'subscribe-collection') {
    mockWs.simulateMessage({
      type: 'subscribed',
      requestId: sentMsg.requestId,
      subscriptionId,
      model,
      primaryKey,
      mode: 'snapshot',
      data,
      version: { seq: 1, timestamp: new Date().toISOString() },
    })
  }
}

describe('EntitySyncService', () => {
  describe('registerModel', () => {
    it('should be idempotent for the same model', async () => {
      await usingAsync(setupClient(), async ({ service }) => {
        service.registerModel(User)
        service.registerModel(User)
      })
    })

    it('should throw on model name conflict', async () => {
      await usingAsync(setupClient(), async ({ service }) => {
        class OtherModel {
          declare id: string
        }
        Object.defineProperty(OtherModel, 'name', { value: 'User' })
        expect(() => service.registerModel(OtherModel)).toThrow('Model name conflict')
      })
    })
  })

  describe('subscribeEntity', () => {
    it('should queue subscribe messages until connected', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        service.subscribeEntity(User, '123')
        expect(mockWs.send).not.toHaveBeenCalled()

        mockWs.simulateOpen()
        expect(mockWs.send).toHaveBeenCalledTimes(1)

        const msg = getSentMessages(mockWs)[0]
        expect(msg.type).toBe('subscribe-entity')
        if (msg.type === 'subscribe-entity') {
          expect(msg.model).toBe('User')
          expect(msg.key).toBe('123')
        }
      })
    })

    it('should start in connecting state', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')
        expect(liveEntity.state.getValue()).toEqual({ status: 'connecting' })
      })
    })

    it('should update state to synced on snapshot response', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')
        subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })

        const state = liveEntity.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toEqual({ id: '123', name: 'John' })
        }
      })
    })

    it('should return same LiveEntity for duplicate subscriptions', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live1 = service.subscribeEntity(User, '123')
        const live2 = service.subscribeEntity(User, '123')
        expect(live1.state).toBe(live2.state)
        expect(mockWs.send).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('subscribeCollection', () => {
    it('should send subscribe-collection message', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        service.subscribeCollection(ChatMessage)

        const msg = getSentMessages(mockWs).at(-1)
        expect(msg?.type).toBe('subscribe-collection')
        if (msg?.type === 'subscribe-collection') {
          expect(msg.model).toBe('ChatMessage')
        }
      })
    })

    it('should send filter, top, skip, order options', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        service.subscribeCollection(ChatMessage, {
          filter: { roomId: { $eq: 'room-1' } },
          top: 10,
          skip: 0,
          order: { id: 'DESC' },
        })

        const msg = getSentMessages(mockWs).at(-1)
        if (msg?.type === 'subscribe-collection') {
          expect(msg.filter).toEqual({ roomId: { $eq: 'room-1' } })
          expect(msg.top).toBe(10)
          expect(msg.skip).toBe(0)
          expect(msg.order).toEqual({ id: 'DESC' })
        }
      })
    })

    it('should start in connecting state', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        expect(live.state.getValue()).toEqual({ status: 'connecting' })
      })
    })

    it('should update state to synced on snapshot response', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        subscribeCollectionAndRespond(
          mockWs,
          'sub-1',
          [
            { id: 'msg-1', text: 'Hello', roomId: 'room-1' },
            { id: 'msg-2', text: 'World', roomId: 'room-1' },
          ],
          'id',
        )

        const state = live.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toHaveLength(2)
        }
      })
    })

    it('should return same LiveCollection for duplicate subscriptions', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live1 = service.subscribeCollection(ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        const live2 = service.subscribeCollection(ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        expect(live1.state).toBe(live2.state)
        expect(mockWs.send).toHaveBeenCalledTimes(1)
      })
    })

    it('should create separate subscriptions for different filters', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live1 = service.subscribeCollection(ChatMessage, { filter: { roomId: { $eq: 'room-1' } } })
        const live2 = service.subscribeCollection(ChatMessage, { filter: { roomId: { $eq: 'room-2' } } })
        expect(live1.state).not.toBe(live2.state)
        expect(mockWs.send).toHaveBeenCalledTimes(2)
      })
    })

    it('should queue collection subscribe messages until connected', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        service.subscribeCollection(ChatMessage)
        expect(mockWs.send).not.toHaveBeenCalled()

        mockWs.simulateOpen()
        expect(mockWs.send).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('collection live updates', () => {
    it('should handle entity-added to collection', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        subscribeCollectionAndRespond(mockWs, 'sub-1', [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }], 'id')

        mockWs.simulateMessage({
          type: 'entity-added',
          subscriptionId: 'sub-1',
          entity: { id: 'msg-2', text: 'World', roomId: 'room-1' },
          version: { seq: 2, timestamp: new Date().toISOString() },
        })

        const state = live.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toHaveLength(2)
        }
      })
    })

    it('should handle entity-updated in collection', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        subscribeCollectionAndRespond(mockWs, 'sub-1', [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }], 'id')

        mockWs.simulateMessage({
          type: 'entity-updated',
          subscriptionId: 'sub-1',
          id: 'msg-1',
          change: { text: 'Updated' },
          version: { seq: 2, timestamp: new Date().toISOString() },
        })

        const state = live.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toHaveLength(1)
          expect(state.data[0]).toMatchObject({ id: 'msg-1', text: 'Updated' })
        }
      })
    })

    it('should handle entity-removed from collection', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        subscribeCollectionAndRespond(
          mockWs,
          'sub-1',
          [
            { id: 'msg-1', text: 'Hello', roomId: 'room-1' },
            { id: 'msg-2', text: 'World', roomId: 'room-1' },
          ],
          'id',
        )

        mockWs.simulateMessage({
          type: 'entity-removed',
          subscriptionId: 'sub-1',
          id: 'msg-1',
          version: { seq: 2, timestamp: new Date().toISOString() },
        })

        const state = live.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toHaveLength(1)
          expect(state.data[0]).toMatchObject({ id: 'msg-2' })
        }
      })
    })
  })

  describe('collection auto-suspend', () => {
    it('should suspend after all refs disposed and delay elapsed', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeCollection(ChatMessage)
          const live2 = service.subscribeCollection(ChatMessage)
          subscribeCollectionAndRespond(mockWs, 'sub-1', [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }], 'id')
          mockWs.send.mockClear()

          live1[Symbol.dispose]()
          expect(mockWs.send).not.toHaveBeenCalled()

          live2[Symbol.dispose]()
          expect(mockWs.send).not.toHaveBeenCalled()

          vi.advanceTimersByTime(1500)

          expect(mockWs.send).toHaveBeenCalledTimes(1)
          const unsubMsg = getSentMessages(mockWs)[0]
          expect(unsubMsg.type).toBe('unsubscribe')

          expect(live1.state.getValue()).toEqual({
            status: 'suspended',
            data: [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }],
          })
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should cancel suspend timer if new subscriber appears', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeCollection(ChatMessage)
          subscribeCollectionAndRespond(mockWs, 'sub-1', [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }], 'id')

          live1[Symbol.dispose]()

          vi.advanceTimersByTime(500)
          const live2 = service.subscribeCollection(ChatMessage)

          vi.advanceTimersByTime(1500)

          expect(live2.state.getValue()).toEqual({
            status: 'synced',
            data: [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }],
          })
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should re-subscribe after suspend when new subscriber appears', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeCollection(ChatMessage)
          subscribeCollectionAndRespond(mockWs, 'sub-1', [{ id: 'msg-1', text: 'Hello', roomId: 'room-1' }], 'id')

          live1[Symbol.dispose]()
          vi.advanceTimersByTime(1500)
          mockWs.send.mockClear()

          const live2 = service.subscribeCollection(ChatMessage)

          expect(mockWs.send).toHaveBeenCalledTimes(1)
          const resubMsg = getSentMessages(mockWs)[0]
          expect(resubMsg.type).toBe('subscribe-collection')

          expect(live2.state.getValue()).toEqual({ status: 'connecting' })
        })
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('entity auto-suspend', () => {
    it('should suspend after all refs disposed and delay elapsed', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeEntity(User, '123')
          const live2 = service.subscribeEntity(User, '123')
          subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })
          mockWs.send.mockClear()

          live1[Symbol.dispose]()
          expect(mockWs.send).not.toHaveBeenCalled()

          live2[Symbol.dispose]()
          expect(mockWs.send).not.toHaveBeenCalled()

          vi.advanceTimersByTime(1500)

          expect(mockWs.send).toHaveBeenCalledTimes(1)
          const unsubMsg = getSentMessages(mockWs)[0]
          expect(unsubMsg.type).toBe('unsubscribe')

          expect(live1.state.getValue()).toEqual({ status: 'suspended', data: { id: '123', name: 'John' } })
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should cancel suspend timer if new subscriber appears', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeEntity(User, '123')
          subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })

          live1[Symbol.dispose]()

          vi.advanceTimersByTime(500)
          const live2 = service.subscribeEntity(User, '123')

          vi.advanceTimersByTime(1500)

          expect(live2.state.getValue()).toEqual({ status: 'synced', data: { id: '123', name: 'John' } })
        })
      } finally {
        vi.useRealTimers()
      }
    })

    it('should re-subscribe after suspend when new subscriber appears', async () => {
      vi.useFakeTimers()
      try {
        await usingAsync(setupClient(), async ({ mockWs, service }) => {
          mockWs.simulateOpen()
          const live1 = service.subscribeEntity(User, '123')
          subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })

          live1[Symbol.dispose]()
          vi.advanceTimersByTime(1500)
          mockWs.send.mockClear()

          const live2 = service.subscribeEntity(User, '123')

          expect(mockWs.send).toHaveBeenCalledTimes(1)
          const resubMsg = getSentMessages(mockWs)[0]
          expect(resubMsg.type).toBe('subscribe-entity')

          expect(live2.state.getValue()).toEqual({ status: 'connecting' })
        })
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('entity live updates', () => {
    it('should handle entity-updated messages', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')
        subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })

        mockWs.simulateMessage({
          type: 'entity-updated',
          subscriptionId: 'sub-1',
          id: '123',
          change: { name: 'Jane' },
          version: { seq: 2, timestamp: new Date().toISOString() },
        })

        const state = liveEntity.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toEqual({ id: '123', name: 'Jane' })
        }
      })
    })

    it('should handle entity-added messages', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')
        subscribeAndRespond(mockWs, 'sub-1', undefined)

        mockWs.simulateMessage({
          type: 'entity-added',
          subscriptionId: 'sub-1',
          entity: { id: '123', name: 'John' },
          version: { seq: 1, timestamp: new Date().toISOString() },
        })

        const state = liveEntity.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toEqual({ id: '123', name: 'John' })
        }
      })
    })

    it('should handle entity-removed messages', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')
        subscribeAndRespond(mockWs, 'sub-1', { id: '123', name: 'John' })

        mockWs.simulateMessage({
          type: 'entity-removed',
          subscriptionId: 'sub-1',
          id: '123',
          version: { seq: 2, timestamp: new Date().toISOString() },
        })

        const state = liveEntity.state.getValue()
        expect(state.status).toBe('synced')
        if (state.status === 'synced') {
          expect(state.data).toBeUndefined()
        }
      })
    })
  })

  describe('error handling', () => {
    it('should handle subscription-error messages for entities', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const liveEntity = service.subscribeEntity(User, '123')

        const sentMsg = getSentMessages(mockWs)[0]
        if (sentMsg.type === 'subscribe-entity') {
          mockWs.simulateMessage({
            type: 'subscription-error',
            requestId: sentMsg.requestId,
            error: 'Not authorized',
          })
        }

        const state = liveEntity.state.getValue()
        expect(state.status).toBe('error')
        if (state.status === 'error') {
          expect(state.error).toBe('Not authorized')
        }
      })
    })

    it('should handle subscription-error messages for collections', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)

        const sentMsg = getSentMessages(mockWs).at(-1)
        if (sentMsg?.type === 'subscribe-collection') {
          mockWs.simulateMessage({
            type: 'subscription-error',
            requestId: sentMsg.requestId,
            error: 'Model not registered',
          })
        }

        const state = live.state.getValue()
        expect(state.status).toBe('error')
        if (state.status === 'error') {
          expect(state.error).toBe('Model not registered')
        }
      })
    })

    it('should set error state on WebSocket error for both entities and collections', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        service.subscribeEntity(User, '123')
        service.subscribeCollection(ChatMessage)
        mockWs.simulateError()

        const liveEntity = service.subscribeEntity(User, '123')
        expect(liveEntity.state.getValue().status).toBe('error')

        const liveCollection = service.subscribeCollection(ChatMessage)
        expect(liveCollection.state.getValue().status).toBe('error')
      })
    })
  })

  describe('dispose', () => {
    it('should close WebSocket and clean up', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        service.subscribeEntity(User, '123')
        service.subscribeCollection(ChatMessage)
        service[Symbol.dispose]()

        expect(mockWs.close).toHaveBeenCalled()
      })
    })

    it('should be safe to dispose multiple handles', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeEntity(User, '123')
        live[Symbol.dispose]()
        live[Symbol.dispose]()
      })
    })

    it('should be safe to dispose multiple collection handles', async () => {
      await usingAsync(setupClient(), async ({ mockWs, service }) => {
        mockWs.simulateOpen()
        const live = service.subscribeCollection(ChatMessage)
        live[Symbol.dispose]()
        live[Symbol.dispose]()
      })
    })
  })
})

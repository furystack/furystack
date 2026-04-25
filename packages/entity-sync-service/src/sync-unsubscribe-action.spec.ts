import { defineStore, InMemoryStore, type StoreToken } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'
import type { WebSocketActionContext, WebSocketActionMatchContext } from '@furystack/websocket-api'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'
import { describe, expect, it, vi } from 'vitest'
import { SubscriptionManager } from './subscription-manager.js'
import { SyncUnsubscribeAction } from './sync-unsubscribe-action.js'

class TestEntity {
  declare id: string
}

const TestEntityStore: StoreToken<TestEntity, 'id'> = defineStore({
  name: 'test/sync-unsubscribe/Store',
  model: TestEntity,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: TestEntity, primaryKey: 'id' }),
})

const TestEntityDataSet: DataSetToken<TestEntity, 'id'> = defineDataSet({
  name: 'test/sync-unsubscribe/DataSet',
  store: TestEntityStore,
})

const buildMatchContext = (data: string | object): WebSocketActionMatchContext => ({
  data: (typeof data === 'string' ? data : JSON.stringify(data)) as unknown as Data,
  request: {} as IncomingMessage,
  socket: {} as WebSocket,
})

describe('SyncUnsubscribeAction', () => {
  describe('canExecute', () => {
    it('returns true for a well-formed unsubscribe message', () => {
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext({ type: 'unsubscribe', subscriptionId: 'x' }))).toBe(
        true,
      )
    })

    it('returns false for other message types', () => {
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext({ type: 'subscribe-entity' }))).toBe(false)
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext({ type: 'subscribe-collection' }))).toBe(false)
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext({ type: 'something-else' }))).toBe(false)
    })

    it('returns false for messages without a type field', () => {
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext({ subscriptionId: 'x' }))).toBe(false)
    })

    it('returns false for invalid JSON payloads', () => {
      expect(SyncUnsubscribeAction.canExecute(buildMatchContext('this is not json'))).toBe(false)
    })
  })

  describe('execute', () => {
    it('calls SubscriptionManager.unsubscribe with the message subscriptionId', async () => {
      await usingAsync(createInjector(), async (injector) => {
        injector.get(TestEntityDataSet)
        const manager = injector.get(SubscriptionManager)
        const unsubscribeSpy = vi.spyOn(manager, 'unsubscribe')

        const context: WebSocketActionContext = {
          ...buildMatchContext({ type: 'unsubscribe', subscriptionId: 'sub-42' }),
          injector,
        }

        await SyncUnsubscribeAction.execute(context)
        expect(unsubscribeSpy).toHaveBeenCalledWith('sub-42')
        expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('does not call SubscriptionManager.unsubscribe for non-unsubscribe messages', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const manager = injector.get(SubscriptionManager)
        const unsubscribeSpy = vi.spyOn(manager, 'unsubscribe')

        const context: WebSocketActionContext = {
          ...buildMatchContext({ type: 'subscribe-entity', requestId: 'r1', model: 'TestEntity', key: 'x' }),
          injector,
        }

        await SyncUnsubscribeAction.execute(context)
        expect(unsubscribeSpy).not.toHaveBeenCalled()
      })
    })
  })
})

import type { WebSocketAction } from '@furystack/websocket-api'
import type { ClientSyncMessage } from '@furystack/entity-sync'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * WebSocket action that handles `subscribe-entity` and `subscribe-collection`
 * messages. Plain descriptor — resolve dependencies from the per-message
 * injector provided by `useWebSocketApi`.
 */
export const SyncSubscribeAction: WebSocketAction = {
  canExecute: ({ data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const msg = JSON.parse(data.toString()) as { type?: string }
      return msg.type === 'subscribe-entity' || msg.type === 'subscribe-collection'
    } catch {
      return false
    }
  },
  execute: async ({ data, socket, injector }) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const msg = JSON.parse(data.toString()) as ClientSyncMessage
    const manager = injector.get(SubscriptionManager)

    if (msg.type === 'subscribe-entity') {
      await manager.subscribeEntity(socket, injector, msg.requestId, msg.model, msg.key, msg.lastSeq)
    } else if (msg.type === 'subscribe-collection') {
      await manager.subscribeCollection(
        socket,
        injector,
        msg.requestId,
        msg.model,
        msg.filter,
        msg.top,
        msg.skip,
        msg.order,
      )
    }
  },
}

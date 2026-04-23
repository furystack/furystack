import type { WebSocketAction } from '@furystack/websocket-api'
import type { ClientSyncMessage } from '@furystack/entity-sync'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * WebSocket action that handles `unsubscribe` messages. Resolves the
 * {@link SubscriptionManager} from the per-message injector.
 */
export const SyncUnsubscribeAction: WebSocketAction = {
  canExecute: ({ data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const msg = JSON.parse(data.toString()) as { type?: string }
      return msg.type === 'unsubscribe'
    } catch {
      return false
    }
  },
  execute: async ({ data, injector }) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const msg = JSON.parse(data.toString()) as ClientSyncMessage
    if (msg.type === 'unsubscribe') {
      injector.get(SubscriptionManager).unsubscribe(msg.subscriptionId)
    }
  },
}

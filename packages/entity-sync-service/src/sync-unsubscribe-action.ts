import { Injectable, getInjectorReference } from '@furystack/inject'
import type { WebSocketAction } from '@furystack/websocket-api'
import type { ClientSyncMessage } from '@furystack/entity-sync'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * WebSocket action that handles unsubscribe messages
 */
@Injectable({ lifetime: 'transient' })
export class SyncUnsubscribeAction implements WebSocketAction {
  public [Symbol.dispose](): void {
    /* noop */
  }

  public static canExecute(options: { data: Data }): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const msg = JSON.parse(options.data.toString()) as { type?: string }
      return msg.type === 'unsubscribe'
    } catch {
      return false
    }
  }

  public async execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const msg = JSON.parse(options.data.toString()) as ClientSyncMessage
    if (msg.type === 'unsubscribe') {
      getInjectorReference(this).getInstance(SubscriptionManager).unsubscribe(msg.subscriptionId)
    }
  }
}

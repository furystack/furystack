import { Injectable, Injected, getInjectorReference } from '@furystack/inject'
import type { WebSocketAction } from '@furystack/websocket-api'
import type { ClientSyncMessage } from '@furystack/entity-sync'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * WebSocket action that handles subscribe-entity and subscribe-collection messages
 */
@Injectable({ lifetime: 'transient' })
export class SyncSubscribeAction implements WebSocketAction {
  public [Symbol.dispose](): void {
    /* noop */
  }

  public static canExecute(options: { data: Data }): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const msg = JSON.parse(options.data.toString()) as { type?: string }
      return msg.type === 'subscribe-entity' || msg.type === 'subscribe-collection'
    } catch {
      return false
    }
  }

  public async execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const msg = JSON.parse(options.data.toString()) as ClientSyncMessage
    const connectionInjector = getInjectorReference(this)

    if (msg.type === 'subscribe-entity') {
      await this.subscriptionManager.subscribeEntity(
        options.socket,
        connectionInjector,
        msg.requestId,
        msg.model,
        msg.key,
        msg.lastSeq,
      )
    } else if (msg.type === 'subscribe-collection') {
      await this.subscriptionManager.subscribeCollection(
        options.socket,
        connectionInjector,
        msg.requestId,
        msg.model,
        msg.filter,
        msg.top,
        msg.skip,
        msg.order,
      )
    }
  }

  @Injected(SubscriptionManager)
  declare private readonly subscriptionManager: SubscriptionManager
}

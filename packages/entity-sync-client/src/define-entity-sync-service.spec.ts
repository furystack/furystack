import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { defineEntitySyncService } from './define-entity-sync-service.js'
import { EntitySyncService } from './entity-sync-service.js'

/**
 * Minimal `WebSocket`-shaped object that satisfies `EntitySyncService`'s
 * connect/teardown contract without opening a real socket. The service only
 * touches `close`, `readyState`, and the four `on*` hooks during the paths
 * exercised here.
 */
const createMockWebSocket = () => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: 0,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
})

const baseOptions = () => ({
  wsUrl: 'ws://test/define-entity-sync-service',
  reconnect: false,
  createWebSocket: () => createMockWebSocket() as unknown as WebSocket,
})

describe('defineEntitySyncService', () => {
  it('mints an EntitySyncService instance with the configured options', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const Sync = defineEntitySyncService(baseOptions())
      const service = injector.get(Sync)
      expect(service).toBeInstanceOf(EntitySyncService)
    })
  })

  it('caches the service as a singleton — repeated get() returns the same instance', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const Sync = defineEntitySyncService(baseOptions())
      const a = injector.get(Sync)
      const b = injector.get(Sync)
      expect(a).toBe(b)
    })
  })

  it('mints distinct tokens per call so two definitions resolve to two services', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const SyncA = defineEntitySyncService(baseOptions())
      const SyncB = defineEntitySyncService(baseOptions())
      expect(SyncA).not.toBe(SyncB)
      expect(injector.get(SyncA)).not.toBe(injector.get(SyncB))
    })
  })

  it('invokes Symbol.dispose on the service when the owning injector is disposed', async () => {
    const Sync = defineEntitySyncService(baseOptions())
    const injector = createInjector()
    const service = injector.get(Sync)
    const disposeSpy = vi.spyOn(service, Symbol.dispose)
    await injector[Symbol.asyncDispose]()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('passes the wsUrl through to the underlying service', async () => {
    const observedUrls: string[] = []
    const Sync = defineEntitySyncService({
      wsUrl: 'ws://example.test/path',
      reconnect: false,
      createWebSocket: (url: string) => {
        observedUrls.push(url)
        return createMockWebSocket() as unknown as WebSocket
      },
    })
    await usingAsync(createInjector(), async (injector) => {
      injector.get(Sync)
      expect(observedUrls).toEqual(['ws://example.test/path'])
    })
  })

  it('embeds the wsUrl in the token name for debug readability', () => {
    const Sync = defineEntitySyncService({
      wsUrl: 'ws://example.test/named',
      reconnect: false,
      createWebSocket: () => createMockWebSocket() as unknown as WebSocket,
    })
    expect(Sync.name).toBe('furystack/entity-sync-client/EntitySyncService[ws://example.test/named]')
    expect(Sync.lifetime).toBe('singleton')
    expect(Sync.isAsync).toBe(false)
  })
})

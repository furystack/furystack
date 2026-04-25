import { defineService, type Token } from '@furystack/inject'
import { EntitySyncService, type EntitySyncServiceOptions } from './entity-sync-service.js'

/**
 * Mints an application-specific DI token for an {@link EntitySyncService}
 * configured with the supplied options. Follows the same pattern as
 * `defineI18N` in `@furystack/i18n` — declare the token once at module
 * scope, then resolve it through the injector wherever a sync client is
 * needed.
 *
 * The factory instantiates the service on first resolution and registers
 * `onDispose` so `Symbol.dispose` runs when the owning injector is torn
 * down.
 *
 * @example
 * ```ts
 * export const AppEntitySync = defineEntitySyncService({ wsUrl: 'ws://localhost/sync' })
 *
 * const sync = injector.get(AppEntitySync)
 * sync.registerModel(User)
 * ```
 */
export const defineEntitySyncService = (options: EntitySyncServiceOptions): Token<EntitySyncService, 'singleton'> =>
  defineService({
    name: `furystack/entity-sync-client/EntitySyncService[${options.wsUrl}]`,
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const service = new EntitySyncService(options)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      onDispose(() => service[Symbol.dispose]())
      return service
    },
  })

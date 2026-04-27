import type { ServiceContext, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { isAsyncDisposable, isDisposable } from '@furystack/utils'
import type { Constructable } from './models/constructable.js'
import type { PhysicalStore } from './models/physical-store.js'

/**
 * A DI token that resolves to a {@link PhysicalStore} and carries its model
 * and primary key metadata alongside.
 *
 * The metadata lets consumers (repositories, entity sync, migration tools)
 * discover the store's shape without having to pass the model constructor and
 * primary key separately at every call site.
 */
export type StoreToken<T, TPrimaryKey extends keyof T> = Token<PhysicalStore<T, TPrimaryKey>, 'singleton'> & {
  readonly model: Constructable<T>
  readonly primaryKey: TPrimaryKey
}

export type DefineStoreOptions<T, TPrimaryKey extends keyof T> = {
  /**
   * Debug-only identifier. Token identity is established by the returned
   * {@link StoreToken} object reference, not this string.
   */
  name: string
  model: Constructable<T>
  primaryKey: TPrimaryKey
  /**
   * Produces the store instance. Called once per root injector (singleton
   * lifetime). Use the {@link ServiceContext} to resolve dependencies or
   * register additional disposal callbacks beyond the auto-disposal that
   * {@link defineStore} adds.
   */
  factory: (ctx: ServiceContext<'singleton'>) => PhysicalStore<T, TPrimaryKey>
}

/**
 * Defines a physical store as a first-class DI token.
 *
 * Equivalent to {@link defineService} with a singleton lifetime, with two
 * additions:
 *
 * - The returned token carries `model` and `primaryKey` metadata, so callers
 *   can rebuild queries or DataSets from the token alone.
 * - The factory installs an {@link ServiceContext.onDispose} hook that
 *   automatically disposes the store (sync or async) when the owning injector
 *   is disposed.
 *
 * @example
 * ```ts
 * export const UserStore = defineStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   primaryKey: 'username',
 *   factory: () => new InMemoryStore({ model: User, primaryKey: 'username' }),
 * })
 *
 * const store = injector.get(UserStore)
 * ```
 */
export const defineStore = <T, const TPrimaryKey extends keyof T>(
  options: DefineStoreOptions<T, TPrimaryKey>,
): StoreToken<T, TPrimaryKey> => {
  const token = defineService({
    name: options.name,
    lifetime: 'singleton',
    factory: (ctx) => {
      const store = options.factory(ctx)
      ctx.onDispose(async () => {
        if (isAsyncDisposable(store)) {
          await store[Symbol.asyncDispose]()
          return
        }
        if (isDisposable(store)) {
          store[Symbol.dispose]()
        }
      })
      return store
    },
  })
  const result: StoreToken<T, TPrimaryKey> = Object.assign(token, {
    model: options.model,
    primaryKey: options.primaryKey,
  })
  return result
}

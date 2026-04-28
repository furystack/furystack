import type { Constructable, StoreToken } from '@furystack/core'
import { defineStore } from '@furystack/core'
import { FileSystemStore } from './filesystem-store.js'

/**
 * Options accepted by {@link defineFileSystemStore}.
 */
export type DefineFileSystemStoreOptions<T, TPrimaryKey extends keyof T> = {
  name: string
  model: Constructable<T>
  primaryKey: TPrimaryKey
  /** Path of the JSON file backing the store. */
  fileName: string
  /** Flush interval in ms. Defaults to 3000. */
  tickMs?: number
}

/**
 * Mints a singleton {@link StoreToken} backed by a {@link FileSystemStore}.
 *
 * Declare the token once at module scope — calling {@link defineFileSystemStore}
 * inline every time produces a new token identity per call and defeats
 * singleton caching.
 *
 * The token automatically disposes the underlying store (flushing pending
 * changes, closing the FS watcher, clearing the save interval) when the
 * owning injector is disposed — {@link defineStore} registers the hook.
 *
 * @example
 * ```ts
 * export const UserStore = defineFileSystemStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   primaryKey: 'username',
 *   fileName: './data/users.json',
 * })
 *
 * const store = injector.get(UserStore)
 * ```
 */
export const defineFileSystemStore = <T, const TPrimaryKey extends keyof T>(
  options: DefineFileSystemStoreOptions<T, TPrimaryKey>,
): StoreToken<T, TPrimaryKey> =>
  defineStore<T, TPrimaryKey>({
    name: options.name,
    model: options.model,
    primaryKey: options.primaryKey,
    factory: () =>
      new FileSystemStore<T, TPrimaryKey>({
        model: options.model,
        primaryKey: options.primaryKey,
        fileName: options.fileName,
        tickMs: options.tickMs,
      }),
  })

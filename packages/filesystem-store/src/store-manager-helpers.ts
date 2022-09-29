import { addStore } from '@furystack/core'
import type { Constructable, Injector } from '@furystack/inject'
import { FileSystemStore } from './filesystem-store'

/**
 *
 * @param options The Options for store creation
 * @param options.injector The injector to use for creating the store
 * @param options.model The model to use for the store
 * @param options.primaryKey The primary key of the model
 * @param options.fileName The name of the file to use for the store
 * @param options.tickMs The time in ms to wait between each save
 */
export const useFileSystemStore = <T>(options: {
  injector: Injector
  model: Constructable<T>
  primaryKey: keyof T
  fileName: string
  tickMs?: number
}) => {
  const store = new FileSystemStore({ ...options })
  addStore(options.injector, store)
}

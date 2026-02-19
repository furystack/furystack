import type { Constructable, Injector } from '@furystack/inject'
import { Repository } from './repository.js'

/**
 * Returns a Repository on an injector
 * @param injector The Injector instance
 * @returns The Repository instance
 */
export const getRepository = (injector: Injector) => injector.getInstance(Repository)

/**
 * Gets a DataSet for a specific model from the repository.
 *
 * The DataSet is the recommended way to perform all entity mutations (add, update, remove).
 * Writing through the DataSet ensures that authorization, modification hooks, and change events
 * are properly triggered -- which is required for features like entity sync.
 *
 * For server-side or background operations that don't originate from an HTTP request,
 * use {@link useSystemIdentityContext} to create a scoped child injector with elevated privileges.
 *
 * @param injector The Injector instance
 * @param model The Model
 * @param primaryKey The Primary Key field
 * @returns A Repository DataSet for a specific model
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { getDataSetFor } from '@furystack/repository'
 * import { usingAsync } from '@furystack/utils'
 *
 * // In a background job or service
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'background-job' }),
 *   async (systemInjector) => {
 *     const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
 *     await dataSet.add(systemInjector, newEntity)
 *   },
 * )
 * ```
 */
export const getDataSetFor = <T, TPrimaryKey extends keyof T>(
  injector: Injector,
  model: Constructable<T>,
  primaryKey: TPrimaryKey,
) => injector.getInstance(Repository).getDataSetFor(model, primaryKey)

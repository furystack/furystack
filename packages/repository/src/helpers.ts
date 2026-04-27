import type { WithOptionalId } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSet } from './data-set.js'
import type { DataSetToken } from './define-data-set.js'

/**
 * Resolves the {@link DataSet} for `token` on `injector`. The preferred
 * write gateway for application code — `furystack/no-direct-store-token`
 * forbids resolving the underlying `StoreToken` directly. For server-side
 * or background work, wrap `injector` with `useSystemIdentityContext` from
 * `@furystack/core` to obtain an elevated identity before calling this.
 *
 * @example
 * ```ts
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'background-job' }),
 *   async (systemInjector) => {
 *     const dataSet = getDataSetFor(systemInjector, UserDataSet)
 *     await dataSet.add(systemInjector, { username: 'alice', roles: [] })
 *   },
 * )
 * ```
 */
export const getDataSetFor = <T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>>(
  injector: Injector,
  token: DataSetToken<T, TPrimaryKey, TWritableData>,
): DataSet<T, TPrimaryKey, TWritableData> => injector.get(token)

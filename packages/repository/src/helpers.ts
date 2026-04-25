import type { WithOptionalId } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSet } from './data-set.js'
import type { DataSetToken } from './define-data-set.js'

/**
 * Resolves the {@link DataSet} identified by the supplied {@link DataSetToken}
 * on the given injector.
 *
 * Writing through the returned DataSet ensures authorization, modification
 * hooks and change events (required for features such as entity sync) are
 * triggered. Prefer this over direct physical-store access in application
 * code.
 *
 * For server-side or background operations that don't originate from an HTTP
 * request, use
 * {@link import('@furystack/core').useSystemIdentityContext | useSystemIdentityContext}
 * to create a scoped child injector with elevated privileges before calling
 * this helper.
 *
 * @param injector - Any injector in the scope chain.
 * @param token - The data-set token created by `defineDataSet`.
 * @returns The cached {@link DataSet} instance.
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { getDataSetFor } from '@furystack/repository'
 * import { usingAsync } from '@furystack/utils'
 *
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

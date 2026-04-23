import type { Injector } from '@furystack/inject'

import { IdentityContext } from './identity-context.js'
import type { User } from './models/user.js'

/**
 * Options accepted by {@link createSystemIdentityContext} and
 * {@link useSystemIdentityContext}.
 */
export type SystemIdentityContextOptions = {
  /** Username reported by `getCurrentUser`. Defaults to `'system'`. */
  username?: string
}

/**
 * Creates an elevated {@link IdentityContext} that is always authenticated and
 * authorized regardless of roles requested.
 *
 * Intended for trusted server-side operations (background jobs, migrations,
 * seed scripts) where you deliberately want to bypass authorization checks.
 *
 * **Warning:** Never use the returned context in user-facing request
 * pipelines. Any code path it reaches bypasses `isAuthorized` entirely.
 */
export const createSystemIdentityContext = (options?: SystemIdentityContextOptions): IdentityContext => {
  const username = options?.username ?? 'system'
  return {
    isAuthenticated: () => Promise.resolve(true),
    isAuthorized: () => Promise.resolve(true),
    getCurrentUser: <TUser extends User>() => Promise.resolve({ username, roles: [] } as unknown as TUser),
  }
}

/**
 * Creates a child scope of `options.injector` with an elevated system
 * {@link IdentityContext} bound inside it. The returned injector is
 * {@link AsyncDisposable} and is safe to use with `usingAsync` for automatic
 * cleanup.
 *
 * **Warning:** The returned injector bypasses **all** authorization checks.
 * Only use this in trusted server-side contexts (background jobs, migrations,
 * seed scripts). Never hand the returned injector to user-facing request
 * handlers.
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { usingAsync } from '@furystack/utils'
 *
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'seed-script' }),
 *   async (systemInjector) => {
 *     // systemInjector.get(IdentityContext) resolves as authenticated + authorized
 *   },
 * )
 * ```
 */
export const useSystemIdentityContext = (options: SystemIdentityContextOptions & { injector: Injector }): Injector => {
  const scope = options.injector.createScope({ owner: 'SystemIdentityContext' })
  const ctx = createSystemIdentityContext(options)
  scope.bind(IdentityContext, () => ctx)
  return scope
}

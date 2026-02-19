import type { Injector } from '@furystack/inject'

import { IdentityContext } from './identity-context.js'
import type { User } from './models/user.js'

/**
 * An elevated {@link IdentityContext} that is always authenticated and authorized.
 * Intended for trusted server-side operations such as background jobs, migrations, and seed scripts.
 *
 * **Warning:** This context bypasses **all** authorization checks. Never use it in user-facing
 * request pipelines or any context where untrusted input could reach the DataSet.
 * Prefer {@link useSystemIdentityContext} for scoped usage with automatic cleanup.
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { getDataSetFor } from '@furystack/repository'
 * import { usingAsync } from '@furystack/utils'
 *
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'migration-job' }),
 *   async (systemInjector) => {
 *     const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
 *     await dataSet.add(systemInjector, newEntity)
 *   },
 * )
 * ```
 */
export class SystemIdentityContext extends IdentityContext {
  private readonly username: string

  constructor(options?: { username?: string }) {
    super()
    this.username = options?.username ?? 'system'
  }

  public override isAuthenticated() {
    return Promise.resolve(true)
  }

  public override isAuthorized(..._roles: string[]) {
    return Promise.resolve(true)
  }

  public override getCurrentUser<TUser extends User>(): Promise<TUser> {
    return Promise.resolve({ username: this.username, roles: [] } as TUser)
  }
}

/**
 * Creates a scoped child injector with an elevated {@link SystemIdentityContext}.
 * The returned injector is {@link AsyncDisposable} and works with `usingAsync()` for automatic cleanup.
 *
 * **Warning:** The returned injector bypasses **all** authorization checks. Only use this in trusted
 * server-side contexts (background jobs, migrations, seed scripts). Never pass the returned injector
 * to user-facing request handlers.
 *
 * @param options.injector The parent injector to create a child from
 * @param options.username The username for the system identity (defaults to `'system'`)
 * @returns A child injector with the SystemIdentityContext set as the IdentityContext
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { getDataSetFor } from '@furystack/repository'
 * import { usingAsync } from '@furystack/utils'
 *
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'seed-script' }),
 *   async (systemInjector) => {
 *     const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
 *     await dataSet.add(systemInjector, { value: 'seeded' })
 *   },
 * )
 * // systemInjector is disposed here -- all scoped instances cleaned up
 * ```
 */
export const useSystemIdentityContext = (options: { injector: Injector; username?: string }): Injector => {
  const ctx = new SystemIdentityContext({ username: options.username })
  const childInjector = options.injector.createChild({ owner: 'SystemIdentityContext' })
  childInjector.setExplicitInstance(ctx, IdentityContext)
  return childInjector
}

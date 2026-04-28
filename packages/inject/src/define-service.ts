import type { Injector } from './injector.js'
import type { DefineServiceAsyncOptions, DefineServiceOptions, Lifetime, Token } from './types.js'

/**
 * Each {@link defineService} call mints a fresh {@link Symbol} as the token's
 * identity. The symbol's description uses `name` purely for debug/readability;
 * uniqueness comes from the `Symbol` constructor itself and is independent of
 * the description.
 *
 * Using a plain `Symbol` (not `Symbol.for`) gives two important properties:
 *
 * - **Cross-author collision is structurally impossible.** Two packages can
 *   choose the same `name` and still get distinct tokens because each module
 *   evaluation produces its own symbol.
 * - **Intentional dual-version usage works.** If an application deliberately
 *   depends on two versions of the same library, each version's
 *   `defineService` call runs independently and yields its own token, so both
 *   versions coexist with separate caches.
 *
 * The trade-off is that duplicate module instances of a single library version
 * (a misconfigured `peerDependency`, `npm link`, etc.) produce two tokens and
 * therefore two cached singletons for what was meant to be one. That failure
 * mode is rare, obvious in symptoms, and user-fixable — strictly preferable to
 * the silent cross-author collision that `Symbol.for` would enable.
 */
const createTokenId = (name: string): symbol => Symbol(name)

/**
 * Defines a sync service and returns a {@link Token} resolvable via
 * {@link Injector.get}.
 *
 * @example
 * ```ts
 * const Counter = defineService({
 *   name: 'my-app/Counter',
 *   lifetime: 'singleton',
 *   factory: () => {
 *     let value = 0
 *     return { increment: () => ++value, getValue: () => value }
 *   },
 * })
 * ```
 */
export const defineService = <TService, TLifetime extends Lifetime>(
  options: DefineServiceOptions<TService, TLifetime>,
): Token<TService, TLifetime, false> => {
  return {
    id: createTokenId(options.name),
    name: options.name,
    lifetime: options.lifetime,
    isAsync: false,
    factory: options.factory,
  }
}

/**
 * Async counterpart of {@link defineService}. The returned token can only be
 * resolved via {@link Injector.getAsync} — {@link Injector.get} rejects async
 * tokens at compile time.
 *
 * Resolved values are cached after first resolution; concurrent callers share
 * the same pending promise.
 */
export const defineServiceAsync = <TService, TLifetime extends Lifetime>(
  options: DefineServiceAsyncOptions<TService, TLifetime>,
): Token<TService, TLifetime, true> => {
  return {
    id: createTokenId(options.name),
    name: options.name,
    lifetime: options.lifetime,
    isAsync: true,
    factory: options.factory,
  }
}

export const isToken = <TService = unknown>(value: unknown): value is Token<TService> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<Token<TService>>
  return (
    typeof candidate.id === 'symbol' &&
    typeof candidate.name === 'string' &&
    typeof candidate.lifetime === 'string' &&
    typeof candidate.isAsync === 'boolean' &&
    typeof candidate.factory === 'function'
  )
}

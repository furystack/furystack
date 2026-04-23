import type {
  AsyncServiceFactory,
  DefineServiceAsyncOptions,
  DefineServiceOptions,
  Lifetime,
  ServiceFactory,
  Token,
} from './types.js'

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
 * Defines a synchronous service and returns a {@link Token} that can be used
 * to resolve it.
 *
 * Tokens returned from `defineService` are self-registering: the first call to
 * {@link Injector.get} will run the factory with the appropriate context and
 * cache the result according to the declared {@link Lifetime}.
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
    factory: options.factory as ServiceFactory<TService>,
  }
}

/**
 * Defines an asynchronous service. Factories return a promise; resolved values
 * are cached after first resolution. Concurrent callers share the same pending
 * promise.
 *
 * Async tokens cannot be resolved via {@link Injector.get} — use
 * {@link Injector.getAsync} instead. This constraint is enforced at the type
 * level by the `true` literal in the returned {@link Token}.
 */
export const defineServiceAsync = <TService, TLifetime extends Lifetime>(
  options: DefineServiceAsyncOptions<TService, TLifetime>,
): Token<TService, TLifetime, true> => {
  return {
    id: createTokenId(options.name),
    name: options.name,
    lifetime: options.lifetime,
    isAsync: true,
    factory: options.factory as AsyncServiceFactory<TService>,
  }
}

/**
 * Runtime type guard for {@link Token}.
 */
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

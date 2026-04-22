import type {
  AsyncServiceFactory,
  DefineServiceAsyncOptions,
  DefineServiceOptions,
  Lifetime,
  ServiceFactory,
  Token,
} from './types.js'

const createTokenId = (name: string): symbol => {
  if (name.includes('/')) {
    return Symbol.for(`furystack.di/${name}`)
  }
  return Symbol(name)
}

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
): Token<TService, TLifetime> => {
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
 * {@link Injector.getAsync} instead.
 */
export const defineServiceAsync = <TService, TLifetime extends Lifetime>(
  options: DefineServiceAsyncOptions<TService, TLifetime>,
): Token<TService, TLifetime> => {
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

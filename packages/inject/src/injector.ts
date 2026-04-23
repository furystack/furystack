import type {
  AnyToken,
  AsyncServiceFactory,
  AsyncToken,
  CreateScopeOptions,
  DisposeCallback,
  Lifetime,
  ServiceContext,
  ServiceFactory,
  SyncToken,
} from './types.js'

/**
 * Thrown when a method is called on an injector that has already been disposed.
 */
export class InjectorDisposedError extends Error {
  constructor() {
    super('Injector already disposed')
    this.name = 'InjectorDisposedError'
  }
}

/**
 * Thrown when a factory depends on itself (directly or transitively) during
 * instantiation.
 */
export class CircularDependencyError extends Error {
  constructor(public readonly path: readonly string[]) {
    super(`Circular dependency detected: ${path.join(' -> ')}`)
    this.name = 'CircularDependencyError'
  }
}

/**
 * Thrown when a singleton-lifetime service attempts to depend on a non-singleton
 * service, or a scoped service attempts to depend on a transient.
 */
export class InvalidLifetimeDependencyError extends Error {
  constructor(
    public readonly parentName: string,
    public readonly parentLifetime: Lifetime,
    public readonly childName: string,
    public readonly childLifetime: Lifetime,
  ) {
    super(
      `Service '${parentName}' (${parentLifetime}) cannot depend on '${childName}' (${childLifetime}): ${parentLifetime} factories may only depend on compatible lifetimes.`,
    )
    this.name = 'InvalidLifetimeDependencyError'
  }
}

/**
 * Thrown when attempting to resolve an async token via the synchronous
 * {@link Injector.get} method. In well-typed call sites this case is caught at
 * compile time by {@link Injector.get}'s signature; the runtime check exists
 * as a defense for dynamically-constructed tokens.
 */
export class AsyncTokenInSyncContextError extends Error {
  constructor(public readonly tokenName: string) {
    super(`Service '${tokenName}' is async. Resolve it via injector.getAsync() instead of injector.get().`)
    this.name = 'AsyncTokenInSyncContextError'
  }
}

type CacheEntry =
  | { status: 'resolved'; value: unknown }
  | { status: 'pending'; promise: Promise<unknown> }
  | { status: 'failed'; error: unknown }

type AnyFactory<TService> = ServiceFactory<TService> | AsyncServiceFactory<TService>

const isParentCompatible = (parent: Lifetime, child: Lifetime): boolean => {
  switch (parent) {
    case 'singleton':
      return child === 'singleton'
    case 'scoped':
      return child === 'singleton' || child === 'scoped'
    case 'transient':
      return true
    default:
      return false
  }
}

/**
 * The dependency injection container. Created via {@link createInjector} or
 * {@link Injector.createScope}. Manages service resolution, caching, and
 * disposal across a hierarchical scope tree.
 */
export class Injector implements AsyncDisposable {
  public readonly parent: Injector | null
  public readonly owner: unknown
  private readonly cache = new Map<symbol, CacheEntry>()
  private readonly bindings = new Map<symbol, AnyFactory<unknown>>()
  private readonly disposeCallbacks: DisposeCallback[] = []
  private isDisposed = false

  constructor(options?: { parent?: Injector; owner?: unknown }) {
    this.parent = options?.parent ?? null
    this.owner = options?.owner
  }

  private ensureLive(): void {
    if (this.isDisposed) {
      throw new InjectorDisposedError()
    }
  }

  private rootInjector(): Injector {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Injector = this
    while (current.parent) {
      current = current.parent
    }
    return current
  }

  private ownerForLifetime(lifetime: Lifetime): Injector {
    switch (lifetime) {
      case 'singleton':
        return this.rootInjector()
      case 'scoped':
      case 'transient':
        return this
      default:
        return this
    }
  }

  private findCached(token: AnyToken<unknown>): { injector: Injector; entry: CacheEntry } | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: Injector | null = this
    while (current) {
      const entry = current.cache.get(token.id)
      if (entry) {
        return { injector: current, entry }
      }
      current = current.parent
    }
    return null
  }

  private findFactory<TService>(token: AnyToken<TService>): AnyFactory<TService> {
    const owning = this.ownerForLifetime(token.lifetime)
    const bound = owning.bindings.get(token.id)
    if (bound) {
      return bound as AnyFactory<TService>
    }
    return token.factory as AnyFactory<TService>
  }

  private buildContext(token: AnyToken<unknown>, owningInjector: Injector, resolving: Set<symbol>): ServiceContext {
    const { lifetime, name: parentName } = token
    const inject = <TService>(depToken: SyncToken<TService>): TService => {
      if (!isParentCompatible(lifetime, depToken.lifetime)) {
        throw new InvalidLifetimeDependencyError(parentName, lifetime, depToken.name, depToken.lifetime)
      }
      return owningInjector.resolveSync<TService>(depToken, resolving)
    }
    const injectAsync = <TService>(depToken: AnyToken<TService>): Promise<TService> => {
      if (!isParentCompatible(lifetime, depToken.lifetime)) {
        throw new InvalidLifetimeDependencyError(parentName, lifetime, depToken.name, depToken.lifetime)
      }
      return owningInjector.resolveAsync<TService>(depToken, resolving)
    }
    const onDispose = (cb: DisposeCallback): void => {
      owningInjector.disposeCallbacks.push(cb)
    }
    return {
      inject: inject as ServiceContext['inject'],
      injectAsync: injectAsync as ServiceContext['injectAsync'],
      injector: owningInjector,
      token,
      onDispose,
    }
  }

  public get<TService>(token: SyncToken<TService>): TService {
    this.ensureLive()
    if (token.isAsync) {
      throw new AsyncTokenInSyncContextError(token.name)
    }
    return this.resolveSync<TService>(token, new Set<symbol>())
  }

  public getAsync<TService>(token: AnyToken<TService>): Promise<TService> {
    this.ensureLive()
    if (!token.isAsync) {
      return Promise.resolve(this.resolveSync<TService>(token as SyncToken<TService>, new Set<symbol>()))
    }
    return this.resolveAsync<TService>(token, new Set<symbol>())
  }

  private resolveSync<TService>(token: SyncToken<TService>, resolving: Set<symbol>): TService {
    const existing = this.findCached(token)
    if (existing) {
      return this.consumeCached<TService>(existing.entry, token)
    }

    const owning = this.ownerForLifetime(token.lifetime)
    if (token.lifetime !== 'transient' && owning !== this) {
      return owning.resolveSync<TService>(token, resolving)
    }

    return owning.instantiateSync<TService>(token, resolving)
  }

  private resolveAsync<TService>(token: AnyToken<TService>, resolving: Set<symbol>): Promise<TService> {
    const existing = this.findCached(token)
    if (existing) {
      return this.consumeCachedAsync<TService>(existing.entry, token)
    }

    const owning = this.ownerForLifetime(token.lifetime)
    if (token.lifetime !== 'transient' && owning !== this) {
      return owning.resolveAsync<TService>(token, resolving)
    }

    return owning.instantiateAsync<TService>(token, resolving)
  }

  private consumeCached<TService>(entry: CacheEntry, token: AnyToken<TService>): TService {
    if (entry.status === 'resolved') {
      return entry.value as TService
    }
    if (entry.status === 'failed') {
      throw entry.error
    }
    throw new AsyncTokenInSyncContextError(token.name)
  }

  private async consumeCachedAsync<TService>(entry: CacheEntry, _token: AnyToken<TService>): Promise<TService> {
    if (entry.status === 'resolved') {
      return entry.value as TService
    }
    if (entry.status === 'failed') {
      throw entry.error
    }
    return entry.promise as Promise<TService>
  }

  private pushResolving(resolving: Set<symbol>, token: AnyToken<unknown>): void {
    if (resolving.has(token.id)) {
      const path = [...Array.from(resolving).map((id) => id.description ?? '<anonymous>'), token.name]
      throw new CircularDependencyError(path)
    }
    resolving.add(token.id)
  }

  private popResolving(resolving: Set<symbol>, token: AnyToken<unknown>): void {
    resolving.delete(token.id)
  }

  private instantiateSync<TService>(token: SyncToken<TService>, resolving: Set<symbol>): TService {
    this.pushResolving(resolving, token)
    const ctx = this.buildContext(token, this, resolving)
    const factory = this.findFactory<TService>(token) as ServiceFactory<TService>
    try {
      const value = factory(ctx)
      if (token.lifetime !== 'transient') {
        this.cache.set(token.id, { status: 'resolved', value })
      }
      return value
    } catch (error) {
      if (token.lifetime !== 'transient') {
        this.cache.set(token.id, { status: 'failed', error })
      }
      throw error
    } finally {
      this.popResolving(resolving, token)
    }
  }

  private instantiateAsync<TService>(token: AnyToken<TService>, resolving: Set<symbol>): Promise<TService> {
    this.pushResolving(resolving, token)
    const ctx = this.buildContext(token, this, resolving)
    const factory = this.findFactory<TService>(token) as AsyncServiceFactory<TService>
    let promise: Promise<TService>
    try {
      promise = factory(ctx)
    } catch (error) {
      this.popResolving(resolving, token)
      if (token.lifetime !== 'transient') {
        this.cache.set(token.id, { status: 'failed', error })
      }
      throw error
    }
    this.popResolving(resolving, token)

    if (token.lifetime !== 'transient') {
      this.cache.set(token.id, { status: 'pending', promise })
    }

    return promise.then(
      (value) => {
        if (token.lifetime !== 'transient') {
          this.cache.set(token.id, { status: 'resolved', value })
        }
        return value
      },
      (error: unknown) => {
        if (token.lifetime !== 'transient') {
          this.cache.set(token.id, { status: 'failed', error })
        }
        throw error
      },
    )
  }

  /**
   * Installs a factory override for `token` on the injector that would own its
   * cached instance (root for singleton, this injector for scoped/transient).
   * Any cached entry for the token on that injector is dropped so the next
   * resolution uses the new factory.
   */
  public bind<TService, TLifetime extends Lifetime>(
    token: SyncToken<TService, TLifetime>,
    factory: ServiceFactory<TService>,
  ): void
  public bind<TService, TLifetime extends Lifetime>(
    token: AsyncToken<TService, TLifetime>,
    factory: AsyncServiceFactory<TService>,
  ): void
  public bind<TService>(token: AnyToken<TService>, factory: AnyFactory<TService>): void {
    this.ensureLive()
    const owning = this.ownerForLifetime(token.lifetime)
    owning.bindings.set(token.id, factory as AnyFactory<unknown>)
    owning.cache.delete(token.id)
  }

  /**
   * Drops any cached entry for `token` on the injector that owns its cached
   * instance. The next resolution will run the factory again. Useful for
   * recovering from cached factory failures or resetting state between tests.
   */
  public invalidate<TService>(token: AnyToken<TService>): void {
    this.ensureLive()
    const owning = this.ownerForLifetime(token.lifetime)
    owning.cache.delete(token.id)
  }

  public createScope(options?: CreateScopeOptions): Injector {
    this.ensureLive()
    return new Injector({ parent: this, owner: options?.owner })
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    if (this.isDisposed) {
      throw new InjectorDisposedError()
    }
    this.isDisposed = true

    const callbacks = this.disposeCallbacks.splice(0).reverse()
    const errors: unknown[] = []
    for (const cb of callbacks) {
      try {
        await cb()
      } catch (error) {
        errors.push(error)
      }
    }
    this.cache.clear()
    this.bindings.clear()
    if (errors.length > 0) {
      throw new AggregateError(errors, `Errors thrown during injector disposal (${errors.length})`)
    }
  }
}

/**
 * Creates a new root {@link Injector}.
 */
export const createInjector = (): Injector => new Injector()

/**
 * Creates a child scope of `parent`, runs `fn` with it, then disposes the
 * scope — including when `fn` throws. Returns `fn`'s resolved value.
 */
export const withScope = async <TResult>(
  parent: Injector,
  fn: (scope: Injector) => Promise<TResult> | TResult,
  options?: CreateScopeOptions,
): Promise<TResult> => {
  const scope = parent.createScope(options)
  try {
    return await fn(scope)
  } finally {
    await scope[Symbol.asyncDispose]()
  }
}

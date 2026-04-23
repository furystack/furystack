import type {
  AsyncServiceFactory,
  CreateScopeOptions,
  DisposeCallback,
  Injector as InjectorContract,
  Lifetime,
  ServiceContext,
  ServiceFactory,
  Token,
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
 * {@link Injector.get} method.
 */
export class AsyncTokenInSyncContextError extends Error {
  constructor(public readonly tokenName: string) {
    super(`Service '${tokenName}' is async. Resolve it via injector.getAsync() instead of injector.get().`)
    this.name = 'AsyncTokenInSyncContextError'
  }
}

/**
 * Thrown when attempting to {@link Injector.provide} a transient-lifetime token.
 * Transients are, by definition, not cached — providing them is meaningless.
 */
export class CannotProvideTransientError extends Error {
  constructor(public readonly tokenName: string) {
    super(`Cannot provide an instance for transient token '${tokenName}'. Transients are not cached.`)
    this.name = 'CannotProvideTransientError'
  }
}

type CacheEntry =
  | { status: 'resolved'; value: unknown }
  | { status: 'pending'; promise: Promise<unknown> }
  | { status: 'failed'; error: unknown }

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
export class Injector implements InjectorContract, AsyncDisposable {
  public readonly parent: Injector | null
  public readonly owner: unknown
  private readonly cache = new Map<symbol, CacheEntry>()
  private readonly disposeCallbacks: DisposeCallback[] = []
  private readonly resolutionStack: symbol[] = []
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

  private findCached(token: Token<unknown>): { injector: Injector; entry: CacheEntry } | null {
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

  private buildContext(token: Token<unknown>, owningInjector: Injector): ServiceContext {
    const parentName = token.name
    const parentLifetime = token.lifetime
    const inject = <TService>(depToken: Token<TService>): TService => {
      if (!isParentCompatible(parentLifetime, depToken.lifetime)) {
        throw new InvalidLifetimeDependencyError(parentName, parentLifetime, depToken.name, depToken.lifetime)
      }
      return owningInjector.get(depToken)
    }
    const injectAsync = <TService>(depToken: Token<TService>): Promise<TService> => {
      if (!isParentCompatible(parentLifetime, depToken.lifetime)) {
        throw new InvalidLifetimeDependencyError(parentName, parentLifetime, depToken.name, depToken.lifetime)
      }
      return owningInjector.getAsync(depToken)
    }
    const onDispose = (cb: DisposeCallback): void => {
      owningInjector.disposeCallbacks.push(cb)
    }
    return {
      inject: inject as ServiceContext['inject'],
      injectAsync: injectAsync as ServiceContext['injectAsync'],
      injector: owningInjector,
      onDispose,
      token,
    }
  }

  private pushResolving(token: Token<unknown>): void {
    if (this.resolutionStack.includes(token.id)) {
      const path = [...this.resolutionStack.map((id) => this.symbolDescription(id)), token.name]
      throw new CircularDependencyError(path)
    }
    this.resolutionStack.push(token.id)
  }

  private popResolving(): void {
    this.resolutionStack.pop()
  }

  private symbolDescription(id: symbol): string {
    return id.description ?? '<anonymous>'
  }

  public get<TService>(token: Token<TService>): TService {
    this.ensureLive()

    if (token.isAsync) {
      throw new AsyncTokenInSyncContextError(token.name)
    }

    const existing = this.findCached(token)
    if (existing) {
      return this.consumeCached<TService>(existing.entry, token)
    }

    const owning = this.ownerForLifetime(token.lifetime)

    if (token.lifetime !== 'transient' && owning !== this) {
      return owning.get(token)
    }

    return owning.instantiateSync(token)
  }

  public async getAsync<TService>(token: Token<TService>): Promise<TService> {
    this.ensureLive()

    if (!token.isAsync) {
      return this.get(token)
    }

    const existing = this.findCached(token)
    if (existing) {
      return this.consumeCachedAsync<TService>(existing.entry, token)
    }

    const owning = this.ownerForLifetime(token.lifetime)

    if (token.lifetime !== 'transient' && owning !== this) {
      return owning.getAsync(token)
    }

    return owning.instantiateAsync(token)
  }

  private consumeCached<TService>(entry: CacheEntry, token: Token<TService>): TService {
    if (entry.status === 'resolved') {
      return entry.value as TService
    }
    if (entry.status === 'failed') {
      throw entry.error
    }
    throw new AsyncTokenInSyncContextError(token.name)
  }

  private async consumeCachedAsync<TService>(entry: CacheEntry, _token: Token<TService>): Promise<TService> {
    if (entry.status === 'resolved') {
      return entry.value as TService
    }
    if (entry.status === 'failed') {
      throw entry.error
    }
    return entry.promise as Promise<TService>
  }

  private instantiateSync<TService>(token: Token<TService>): TService {
    this.pushResolving(token)
    const ctx = this.buildContext(token, this)
    try {
      const value = (token.factory as ServiceFactory<TService>)(ctx)
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
      this.popResolving()
    }
  }

  private instantiateAsync<TService>(token: Token<TService>): Promise<TService> {
    this.pushResolving(token)
    const ctx = this.buildContext(token, this)
    let promise: Promise<TService>
    try {
      promise = (token.factory as AsyncServiceFactory<TService>)(ctx)
    } catch (error) {
      this.popResolving()
      if (token.lifetime !== 'transient') {
        this.cache.set(token.id, { status: 'failed', error })
      }
      throw error
    }
    this.popResolving()

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

  public provide<TService>(token: Token<TService>, value: TService): void {
    this.ensureLive()
    if (token.lifetime === 'transient') {
      throw new CannotProvideTransientError(token.name)
    }
    this.cache.set(token.id, { status: 'resolved', value })
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

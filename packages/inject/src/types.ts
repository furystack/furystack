/**
 * The lifetime of an injectable service. Determines how and where instances
 * are cached inside an {@link Injector}.
 *
 * - `transient` — a new instance is produced each time the service is requested. Not cached.
 * - `singleton` — a single instance per injector tree. Cached at the root injector.
 * - `scoped` — a single instance per injector scope. Cached at the injector that first requested it.
 */
export type Lifetime = 'transient' | 'singleton' | 'scoped'

/**
 * Opaque, type-carrying handle that identifies a service in the DI container.
 *
 * Created by {@link defineService} or {@link defineServiceAsync}. The `id` symbol
 * is used as the registry key; the phantom `__type` preserves the resolved type
 * for inference at call sites.
 *
 * @typeParam TService - The type returned by the factory when the service is resolved
 * @typeParam TLifetime - The lifetime category of the service
 */
export type Token<TService, TLifetime extends Lifetime = Lifetime> = {
  readonly id: symbol
  readonly name: string
  readonly lifetime: TLifetime
  readonly isAsync: boolean
  readonly factory: ServiceFactory<TService> | AsyncServiceFactory<TService>
  readonly __type?: TService
}

/**
 * Extracts the resolved service type from a {@link Token}.
 */
export type ServiceOf<TToken> = TToken extends Token<infer T, Lifetime> ? T : never

/**
 * Callback registered via {@link ServiceContext.onDispose}, invoked when the
 * owning scope is disposed. May return a promise; async callbacks are awaited
 * as part of scope teardown.
 */
export type DisposeCallback = () => void | Promise<void>

/**
 * Resolves a dependency service by its {@link Token}.
 *
 * The signature is refined per-factory so that singleton factories can only
 * depend on singleton services. See {@link defineService} for how the correct
 * overload is selected.
 */
export type InjectFn<TParentLifetime extends Lifetime = Lifetime> = TParentLifetime extends 'singleton'
  ? <TService>(token: Token<TService, 'singleton'>) => TService
  : <TService>(token: Token<TService>) => TService

/**
 * Asynchronous counterpart of {@link InjectFn}. Used inside async factories to
 * resolve services whose factories return promises. Sync tokens are also
 * accepted and resolved synchronously (wrapped in a resolved promise).
 */
export type InjectAsyncFn<TParentLifetime extends Lifetime = Lifetime> = TParentLifetime extends 'singleton'
  ? <TService>(token: Token<TService, 'singleton'>) => Promise<TService>
  : <TService>(token: Token<TService>) => Promise<TService>

/**
 * Context object passed to a service factory while it is instantiating.
 *
 * @typeParam TLifetime - Lifetime of the service being instantiated. Controls
 *   which dependencies are compile-time reachable via {@link inject}.
 */
export type ServiceContext<TLifetime extends Lifetime = Lifetime> = {
  /** Resolves a dependency by token. */
  inject: InjectFn<TLifetime>
  /** Resolves an async dependency. Available inside sync factories but returns a promise. */
  injectAsync: InjectAsyncFn<TLifetime>
  /** The injector that owns this service's cached instance. */
  injector: Injector
  /** Registers a disposal callback to run (LIFO) when the owning scope is disposed. */
  onDispose: (cb: DisposeCallback) => void
  /**
   * The token being instantiated. Its {@link Token.name}, {@link Token.lifetime}
   * and {@link Token.id} are useful for self-reflection (e.g. scoping a logger
   * by service name). The service type itself is intentionally erased to
   * `unknown` so inference of the factory's return type stays unambiguous.
   */
  token: Token<unknown, TLifetime>
}

/**
 * Factory signature for synchronous services.
 */
export type ServiceFactory<TService> = (ctx: ServiceContext) => TService

/**
 * Factory signature for asynchronous services. Resolved values are cached after
 * first resolution; concurrent callers share the pending promise.
 */
export type AsyncServiceFactory<TService> = (ctx: ServiceContext) => Promise<TService>

/**
 * Options accepted by {@link defineService}.
 *
 * `lifetime` is required — there is no default. Pick explicitly.
 */
export type DefineServiceOptions<TService, TLifetime extends Lifetime> = {
  /**
   * Human-readable label for the service. Used in error messages and debug
   * output — it carries no load-bearing role in identity. Two services may
   * share the same `name` without conflict; each {@link defineService} call
   * produces a fresh, unique {@link Symbol} as the registry key.
   */
  name: string
  /** The lifetime category of the service. */
  lifetime: TLifetime
  /** The factory that produces the service instance. */
  factory: (ctx: ServiceContext<TLifetime>) => TService
}

/**
 * Options accepted by {@link defineServiceAsync}.
 */
export type DefineServiceAsyncOptions<TService, TLifetime extends Lifetime> = {
  name: string
  lifetime: TLifetime
  factory: (ctx: ServiceContext<TLifetime>) => Promise<TService>
}

/**
 * Options for creating a child injector scope.
 */
export type CreateScopeOptions = {
  /** Optional opaque owner reference (e.g. a request, session, element). */
  owner?: unknown
}

/**
 * Minimal public contract of the {@link Injector} primitive. Kept separate so
 * the context types above can reference it without importing the class.
 */
export type Injector = {
  /** Synchronously resolves a service by token. */
  get: <TService>(token: Token<TService>) => TService
  /** Asynchronously resolves a service by token. */
  getAsync: <TService>(token: Token<TService>) => Promise<TService>
  /**
   * Pre-seeds an instance for a singleton or scoped token on this injector.
   * Subsequent {@link Injector.get} calls return the provided value without
   * running the factory.
   */
  provide: <TService>(token: Token<TService>, value: TService) => void
  /** Creates a child scope whose parent is this injector. */
  createScope: (options?: CreateScopeOptions) => Injector
  /** The parent injector, if any. */
  readonly parent: Injector | null
  /** Opaque owner reference captured via {@link CreateScopeOptions.owner}. */
  readonly owner: unknown
  /** Disposes this injector, running registered {@link DisposeCallback}s in LIFO order. */
  [Symbol.asyncDispose]: () => Promise<void>
}

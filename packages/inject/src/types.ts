import type { Injector } from './injector.js'

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
 * @typeParam TIsAsync - `true` for tokens produced by {@link defineServiceAsync},
 *   `false` for tokens produced by {@link defineService}. Encoded as a literal so
 *   {@link Injector.get} can reject async tokens at compile time.
 */
export type Token<TService, TLifetime extends Lifetime = Lifetime, TIsAsync extends boolean = false> = {
  readonly id: symbol
  readonly name: string
  readonly lifetime: TLifetime
  readonly isAsync: TIsAsync
  readonly factory: ServiceFactory<TService> | AsyncServiceFactory<TService>
  readonly __type?: TService
}

/**
 * A token whose factory is synchronous. This is the default specialisation of
 * {@link Token}. Can be resolved via both {@link Injector.get} and
 * {@link Injector.getAsync}.
 */
export type SyncToken<TService, TLifetime extends Lifetime = Lifetime> = Token<TService, TLifetime, false>

/**
 * A token whose factory is asynchronous. Can only be resolved via
 * {@link Injector.getAsync}. Use this type alias when annotating a token
 * variable that comes from {@link defineServiceAsync}.
 */
export type AsyncToken<TService, TLifetime extends Lifetime = Lifetime> = Token<TService, TLifetime, true>

/**
 * A token of either sync or async variety. Use this type when a generic
 * consumer needs to accept both.
 */
export type AnyToken<TService, TLifetime extends Lifetime = Lifetime> =
  | SyncToken<TService, TLifetime>
  | AsyncToken<TService, TLifetime>

/**
 * Extracts the resolved service type from a {@link Token}.
 */
export type ServiceOf<TToken> = TToken extends Token<infer T, Lifetime, boolean> ? T : never

/**
 * Callback registered via {@link ServiceContext.onDispose}, invoked when the
 * owning scope is disposed. May return a promise; async callbacks are awaited
 * as part of scope teardown.
 */
export type DisposeCallback = () => void | Promise<void>

/**
 * Synchronous resolver passed to sync factories. Accepts sync tokens only —
 * async dependencies must be resolved via {@link InjectAsyncFn}.
 *
 * The signature is refined per-factory lifetime so that singleton factories
 * can only depend on singleton services.
 */
export type InjectFn<TParentLifetime extends Lifetime = Lifetime> = TParentLifetime extends 'singleton'
  ? <TService>(token: SyncToken<TService, 'singleton'>) => TService
  : <TService>(token: SyncToken<TService>) => TService

/**
 * Asynchronous resolver. Accepts both sync and async tokens; sync tokens are
 * wrapped in a resolved promise.
 */
export type InjectAsyncFn<TParentLifetime extends Lifetime = Lifetime> = TParentLifetime extends 'singleton'
  ? <TService>(token: AnyToken<TService, 'singleton'>) => Promise<TService>
  : <TService>(token: AnyToken<TService>) => Promise<TService>

/**
 * Context object passed to a service factory.
 */
export type ServiceContext<TLifetime extends Lifetime = Lifetime> = {
  /** Resolves a sync dependency by token. */
  inject: InjectFn<TLifetime>
  /** Resolves an async (or sync) dependency. Returns a promise. */
  injectAsync: InjectAsyncFn<TLifetime>
  /** The injector that owns this service's cached instance. */
  injector: Injector
  /**
   * The token currently being instantiated. Useful for services that want to
   * reflect on their own definition — e.g. scoping loggers by the defining
   * service's {@link Token.name}.
   */
  token: AnyToken<unknown>
  /** Registers a disposal callback to run (LIFO) when the owning scope is disposed. */
  onDispose: (cb: DisposeCallback) => void
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
   * Human-readable identifier used purely for debug/readability. Identity is
   * established by the {@link Token} object reference.
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

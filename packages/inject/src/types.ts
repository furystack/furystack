import type { defineService, defineServiceAsync } from './define-service.js'
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
 * Sync-token specialisation of {@link Token}. Resolvable via both
 * {@link Injector.get} and {@link Injector.getAsync}.
 */
export type SyncToken<TService, TLifetime extends Lifetime = Lifetime> = Token<TService, TLifetime, false>

/**
 * Async-token specialisation of {@link Token}. Only resolvable via
 * {@link Injector.getAsync} — {@link Injector.get} rejects async tokens at
 * compile time.
 */
export type AsyncToken<TService, TLifetime extends Lifetime = Lifetime> = Token<TService, TLifetime, true>

/**
 * Either {@link SyncToken} or {@link AsyncToken}. Use when a consumer needs
 * to accept both varieties generically.
 */
export type AnyToken<TService, TLifetime extends Lifetime = Lifetime> =
  | SyncToken<TService, TLifetime>
  | AsyncToken<TService, TLifetime>

/** Extracts the resolved service type from a {@link Token}. */
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

/** Context object passed to a service factory. */
export type ServiceContext<TLifetime extends Lifetime = Lifetime> = {
  inject: InjectFn<TLifetime>
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

export type ServiceFactory<TService> = (ctx: ServiceContext) => TService

/**
 * Factory for an async service. Resolved values are cached after first
 * resolution; concurrent callers share the same pending promise.
 */
export type AsyncServiceFactory<TService> = (ctx: ServiceContext) => Promise<TService>

/**
 * Options accepted by {@link defineService}. `lifetime` is required — there
 * is no default; pick explicitly.
 */
export type DefineServiceOptions<TService, TLifetime extends Lifetime> = {
  /**
   * Human-readable identifier for debug output only. Token identity is
   * established by the returned {@link Token} object reference, not this
   * string.
   */
  name: string
  lifetime: TLifetime
  factory: (ctx: ServiceContext<TLifetime>) => TService
}

/** See {@link DefineServiceOptions} — same shape, async factory return type. */
export type DefineServiceAsyncOptions<TService, TLifetime extends Lifetime> = {
  name: string
  lifetime: TLifetime
  factory: (ctx: ServiceContext<TLifetime>) => Promise<TService>
}

export type CreateScopeOptions = {
  /** Opaque owner reference (e.g. a request, session, element). */
  owner?: unknown
}

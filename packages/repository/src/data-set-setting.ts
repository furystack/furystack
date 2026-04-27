import type { AuthorizationError, FindOptions, PhysicalStore, WithOptionalId } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSet } from './data-set.js'

/** Discriminated union returned by authorizer callbacks. */
export type AuthorizationResult = SuccessfullyValidationResult | FailedValidationResult

export interface SuccessfullyValidationResult {
  isAllowed: true
}

export interface FailedValidationResult {
  isAllowed: false
  /** Surfaced as the message of the thrown {@link AuthorizationError}. */
  message: string
}

/**
 * Configuration for a {@link DataSet}: backing store + authorization +
 * modification hooks + filter post-processing. Every callback is optional —
 * an empty `DataSetSettings` performs no checks and forwards calls straight
 * to the physical store.
 *
 * Authorization callbacks come in two flavours:
 *
 * - `authorizeX` — runs **before** the entity is loaded. Use for cheap,
 *   identity-only checks ("is the user logged in?", "is the user an admin?").
 *   When omitted, no pre-check is performed.
 * - `authorizeXEntity` — runs **after** the entity is loaded, with the
 *   loaded entity in scope. Use for ownership / row-level checks. Missing
 *   entities skip the per-entity check entirely.
 *
 * A callback returning `{ isAllowed: false }` makes the operation throw
 * {@link AuthorizationError}.
 */
export interface DataSetSettings<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>> {
  physicalStore: PhysicalStore<T, TPrimaryKey, TWritableData>

  /** Pre-persist authorization for `add`. */
  authorizeAdd?: (options: { injector: Injector; entity: TWritableData }) => Promise<AuthorizationResult>

  /** Pre-persist mutation for `add` (default fields, hashing, normalisation). */
  modifyOnAdd?: (options: { injector: Injector; entity: TWritableData }) => Promise<TWritableData>

  /** Pre-load authorization for `update`. Sees the change, not the entity. */
  authorizeUpdate?: (options: { injector: Injector; change: Partial<T> }) => Promise<AuthorizationResult>

  /** Post-load authorization for `update`. Sees both the loaded entity and the change. */
  authorizeUpdateEntity?: (options: {
    injector: Injector
    entity: T
    change: Partial<T>
  }) => Promise<AuthorizationResult>

  /** Pre-persist mutation for `update`. */
  modifyOnUpdate?: (options: { injector: Injector; id: T[keyof T]; entity: Partial<T> }) => Promise<Partial<T>>

  /** Pre-load authorization for `remove`. */
  authorizeRemove?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /** Post-load authorization for `remove`, per loaded entity. */
  authorizeRemoveEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /** Pre-load authorization for `get` / `find` / `count`. No entity in scope. */
  authorizeGet?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /** Post-load authorization for `get`, per loaded entity. */
  authorizeGetEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * Filter post-processor. Receives the caller's {@link FindOptions} and
   * returns a (potentially augmented) one. Use to inject mandatory clauses
   * (tenant scoping, soft-delete masks) the caller cannot bypass.
   */
  addFilter?: <TFields extends Array<keyof T>>(options: {
    injector: Injector
    filter: FindOptions<T, TFields>
  }) => Promise<FindOptions<T, TFields>>
}

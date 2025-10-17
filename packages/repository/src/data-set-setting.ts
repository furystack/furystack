import type { FindOptions, PhysicalStore, WithOptionalId } from '@furystack/core'
import type { Injector } from '@furystack/inject'

/**
 * The result model returned by authorizers
 */
export type AuthorizationResult = SuccessfullyValidationResult | FailedValidationResult

export interface SuccessfullyValidationResult {
  /**
   * Indicates if the validation was successful
   */
  isAllowed: true
}

export interface FailedValidationResult {
  /**
   * Indicates if the validation was successful
   */

  isAllowed: false
  /**
   * The error message string
   */
  message: string
}

/**
 * Model for authorizers
 */
export interface DataSetSettings<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>> {
  /**
   * An instance of a physical store
   */
  physicalStore: PhysicalStore<T, TPrimaryKey, TWritableData>

  /**
   * Authorizes the entity creation
   */
  authorizeAdd?: (options: { injector: Injector; entity: TWritableData }) => Promise<AuthorizationResult>

  /**
   * modifies an entity before persisting on creation
   */
  modifyOnAdd?: (options: { injector: Injector; entity: TWritableData }) => Promise<TWritableData>

  /**
   * Authorizes entity updates (before the entity gets loaded from the store)
   */
  authorizeUpdate?: (options: { injector: Injector; change: Partial<T> }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity updates per loaded entity
   */
  authorizeUpdateEntity?: (options: {
    injector: Injector
    entity: T
    change: Partial<T>
  }) => Promise<AuthorizationResult>

  /**
   * modifies an entity before persisting on update
   */
  modifyOnUpdate?: (options: { injector: Injector; id: T[keyof T]; entity: Partial<T> }) => Promise<Partial<T>>

  /**
   * Authorizes entity removal (before the entity gets loaded from the store)
   */
  authorizeRemove?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity removal per loaded entity
   */
  authorizeRemoveEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity retrieval without entity loading
   */
  authorizeGet?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity retrieval
   */
  authorizeGetEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * Additional filter parsing to be appended per filter / query
   */
  addFilter?: <TFields extends Array<keyof T>>(options: {
    injector: Injector
    filter: FindOptions<T, TFields>
  }) => Promise<FindOptions<T, TFields>>
}

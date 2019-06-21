import { PhysicalStore } from '@furystack/core'
import { Injector } from '@furystack/inject'

/**
 * The result model returned by authorizers
 */
export interface AuthorizationResult {
  /**
   * Boolean that indicates if the opoeration is allowed or permitted
   */
  isAllowed: boolean
  /**
   * An optional message
   */
  message?: string
}

/**
 * Model for authorizers
 */
export interface DataSetSettings<T, TFilterType> {
  /**
   * The name of the dataset. Will fall back to the constructor's name
   */
  name: string

  /**
   * An instance of a physical store
   */
  physicalStore: PhysicalStore<T, TFilterType>

  /**
   * Authorizes the entity creation
   */
  authorizeAdd?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * modifies an entity before persisting on creation
   */
  modifyOnAdd?: (options: { injector: Injector; entity: T }) => Promise<T>

  /**
   * Callback that fires right after the entity has been persisted
   */
  onEntityAdded?: (options: { injector: Injector; entity: T }) => void

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
  modifyOnUpdate?: (options: { injector: Injector; entity: T }) => Promise<T>

  /**
   * Callback that fires right after entity update
   */
  onEntityUpdated?: (options: { injector: Injector; id: T[keyof T]; change: Partial<T> }) => void

  /**
   * Authorizes entity removal (before the entity gets loaded from the store)
   */
  authorizeRemove?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity removal per loaded entity
   */
  authroizeRemoveEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * Callback that fires right after entity update
   */
  onEntityRemoved?: (options: { injector: Injector; entity: T }) => void

  /**
   * Authorizes entity retrival w/o entity loading
   */
  authorizeGet?: (options: { injector: Injector }) => Promise<AuthorizationResult>

  /**
   * Authorizes entity retrival
   */
  authorizeGetEntity?: (options: { injector: Injector; entity: T }) => Promise<AuthorizationResult>

  /**
   * Additional filter parsing to be appended per filter / query
   */
  addFilter?: (options: { injector: Injector; filter: TFilterType }) => Promise<TFilterType>
}

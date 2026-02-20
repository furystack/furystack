import type { CreateResult, FilterType, FindOptions, PartialResult, WithOptionalId } from '@furystack/core'
import { AuthorizationError, selectFields } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { DataSetSettings } from './data-set-setting.js'

/**
 * An authorized Repository Store instance that wraps a {@link PhysicalStore} with authorization,
 * modification hooks, and event dispatching.
 *
 * The DataSet is the **recommended write gateway** for all entity mutations. Writing through the DataSet
 * ensures that authorization rules are enforced, modification hooks are applied, and change events
 * (`onEntityAdded`, `onEntityUpdated`, `onEntityRemoved`) are emitted -- which are required for features
 * like entity sync to function correctly.
 *
 * All mutating methods require an `injector` parameter that provides the caller's context (e.g. the current
 * user's identity). For server-side or background operations that don't originate from an HTTP request,
 * use {@link useSystemIdentityContext} to create a scoped child injector with elevated privileges.
 *
 * @example
 * ```ts
 * import { useSystemIdentityContext } from '@furystack/core'
 * import { getDataSetFor } from '@furystack/repository'
 * import { usingAsync } from '@furystack/utils'
 *
 * // Server-side write with an elevated identity
 * await usingAsync(
 *   useSystemIdentityContext({ injector, username: 'background-job' }),
 *   async (systemInjector) => {
 *     const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
 *     await dataSet.add(systemInjector, newEntity)
 *   },
 * )
 * ```
 */
export class DataSet<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>>
  extends EventHub<{
    onEntityAdded: { injector: Injector; entity: T }
    onEntityUpdated: { injector: Injector; id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { injector: Injector; key: T[TPrimaryKey] }
  }>
  implements Disposable
{
  /**
   * Primary key of the contained entity
   */
  public primaryKey: TPrimaryKey

  /**
   * Adds an entity to the DataSet.
   * Runs authorization checks, applies modification hooks, persists to the physical store,
   * and emits an `onEntityAdded` event for each created entity.
   * @param injector The injector from the caller's context. For server-side or background operations
   *   without an HTTP request, use a child injector with an elevated {@link IdentityContext}.
   * @param entities The entities to add
   * @returns The CreateResult with the created entities
   */
  public async add(injector: Injector, ...entities: TWritableData[]): Promise<CreateResult<T>> {
    await Promise.all(
      entities.map(async (entity) => {
        if (this.settings.authorizeAdd) {
          const result = await this.settings.authorizeAdd({ injector, entity })
          if (!result.isAllowed) {
            throw new AuthorizationError(result.message)
          }
        }
      }),
    )

    const parsed = await Promise.all(
      entities.map(async (entity) => {
        return this.settings.modifyOnAdd ? await this.settings.modifyOnAdd({ injector, entity }) : entity
      }),
    )

    const createResult = await this.settings.physicalStore.add(...parsed)
    createResult.created.map((entity) => {
      this.emit('onEntityAdded', { injector, entity })
    })
    return createResult
  }

  /**
   * Updates an entity in the store.
   * Runs authorization checks, applies modification hooks, persists to the physical store,
   * and emits an `onEntityUpdated` event.
   * @param injector The injector from the caller's context. For server-side or background operations
   *   without an HTTP request, use a child injector with an elevated {@link IdentityContext}.
   * @param id The identifier of the entity
   * @param change The update
   */
  public async update(injector: Injector, id: T[TPrimaryKey], change: Partial<T>): Promise<void> {
    if (this.settings.authorizeUpdate) {
      const result = await this.settings.authorizeUpdate({ injector, change })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    if (this.settings.authorizeUpdateEntity) {
      const entity = await this.settings.physicalStore.get(id)
      if (entity) {
        const result = await this.settings.authorizeUpdateEntity({ injector, change, entity })
        if (!result.isAllowed) {
          throw new AuthorizationError(result.message)
        }
      }
    }
    const parsed = this.settings.modifyOnUpdate
      ? await this.settings.modifyOnUpdate({ injector, id, entity: change })
      : change
    await this.settings.physicalStore.update(id, parsed)
    this.emit('onEntityUpdated', { injector, change: parsed, id })
  }

  /**
   * Returns a Promise with the entity count
   * @param injector The Injector from the context
   * @param filter The Filter that will be applied
   * @returns the Count
   */
  public async count(injector: Injector, filter?: FilterType<T>): Promise<number> {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    return await this.settings.physicalStore.count(filter)
  }

  /**
   * Returns a filtered subset of the entity
   * @param injector The Injector from the context
   * @param filter The Filter definition
   * @returns A result with the current items
   */
  public async find<TFields extends Array<keyof T>>(
    injector: Injector,
    filter: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields>>> {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    const parsedFilter = this.settings.addFilter ? await this.settings.addFilter({ injector, filter }) : filter
    return this.settings.physicalStore.find(parsedFilter)
  }

  /**
   * Returns an entity based on its primary key
   * @param injector The injector from the context
   * @param key The identifier of the entity
   * @param select A field list used for projection
   * @returns An item with the current unique key or Undefined
   */
  public async get<TSelect extends Array<keyof T>>(
    injector: Injector,
    key: T[TPrimaryKey],
    select?: TSelect,
  ): Promise<PartialResult<T, TSelect> | undefined> {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    if (this.settings.authorizeGetEntity) {
      const fullEntity = await this.settings.physicalStore.get(key)
      if (!fullEntity) {
        return undefined
      }
      const result = await this.settings.authorizeGetEntity({ injector, entity: fullEntity as T })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
      if (select) {
        return selectFields(fullEntity as T & object, ...select)
      }
      return fullEntity as PartialResult<T, TSelect>
    }
    return await this.settings.physicalStore.get(key, select)
  }

  /**
   * Removes one or more entities based on their primary keys.
   * Runs authorization checks (all-or-nothing), persists to the physical store,
   * and emits an `onEntityRemoved` event for each removed entity.
   * @param injector The injector from the caller's context. For server-side or background operations
   *   without an HTTP request, use a child injector with an elevated {@link IdentityContext}.
   * @param keys The primary keys of the entities to remove
   * @returns A promise that will be resolved / rejected based on the remove success
   */
  public async remove(injector: Injector, ...keys: Array<T[TPrimaryKey]>): Promise<void> {
    if (this.settings.authorizeRemove) {
      const result = await this.settings.authorizeRemove({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    if (this.settings.authorizeRemoveEntity) {
      const entities = await this.settings.physicalStore.find({
        filter: { [this.primaryKey]: { $in: keys } } as unknown as FilterType<T>,
      })
      await Promise.all(
        entities.map(async (entity) => {
          const removeResult = await this.settings.authorizeRemoveEntity!({ injector, entity: entity as T })
          if (!removeResult.isAllowed) {
            throw new AuthorizationError(removeResult.message)
          }
        }),
      )
    }
    await this.settings.physicalStore.remove(...keys)
    keys.forEach((key) => this.emit('onEntityRemoved', { injector, key }))
  }

  constructor(public readonly settings: DataSetSettings<T, TPrimaryKey, TWritableData>) {
    super()
    this.primaryKey = this.settings.physicalStore.primaryKey
  }
}

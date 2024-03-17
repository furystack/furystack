import type { Injector } from '@furystack/inject'
import type { FindOptions, PartialResult, FilterType, WithOptionalId, CreateResult } from '@furystack/core'
import { AuthorizationError } from '@furystack/core'
import type { DataSetSettings } from './data-set-setting.js'
import type { Disposable } from '@furystack/utils'
import { EventHub } from '@furystack/utils'

/**
 * An authorized Repository Store instance
 */
export class DataSet<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>>
  extends EventHub<
    'onEntityAdded' | 'onEntityUpdated' | 'onEntityRemoved',
    {
      onEntityAdded: { injector: Injector; entity: T }
      onEntityUpdated: { injector: Injector; id: T[TPrimaryKey]; change: Partial<T> }
      onEntityRemoved: { injector: Injector; key: T[TPrimaryKey] }
    }
  >
  implements Disposable
{
  public dispose() {
    super.dispose()
  }

  /**
   * Primary key of the contained entity
   */
  public primaryKey: TPrimaryKey

  /**
   * Adds an entity to the DataSet
   * @param injector The injector from the context
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
   * Updates an entity in the store
   * @param injector The injector from the context
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
  public async get(injector: Injector, key: T[TPrimaryKey], select?: Array<keyof T>) {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    const instance = await this.settings.physicalStore.get(key, select)
    if (instance && this.settings && this.settings.authorizeGetEntity) {
      const result = await this.settings.authorizeGetEntity({ injector, entity: instance })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    return instance
  }

  /**
   * Removes an entity based on its primary key
   * @param injector The Injector from the context
   * @param key The primary key
   * @returns A promise that will be resolved / rejected based on the remove success
   */
  public async remove(injector: Injector, key: T[TPrimaryKey]): Promise<void> {
    if (this.settings.authorizeRemove) {
      const result = await this.settings.authorizeRemove({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    if (this.settings.authroizeRemoveEntity) {
      const entity = await this.settings.physicalStore.get(key)
      if (entity) {
        const removeResult = await this.settings.authroizeRemoveEntity({ injector, entity })
        if (!removeResult.isAllowed) {
          throw new AuthorizationError(removeResult.message)
        }
      }
    }
    await this.settings.physicalStore.remove(key)
    this.emit('onEntityRemoved', { injector, key })
  }

  constructor(public readonly settings: DataSetSettings<T, TPrimaryKey, TWritableData>) {
    super()
    this.primaryKey = this.settings.physicalStore.primaryKey
  }
}

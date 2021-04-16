import { Injectable, Injector } from '@furystack/inject'
import {
  AuthorizationError,
  FindOptions,
  PartialResult,
  FilterType,
  WithOptionalId,
  CreateResult,
} from '@furystack/core'
import { DataSetSettings } from './data-set-setting'
import { Disposable, ObservableValue } from '@furystack/utils'

/**
 * An authorized Repository Store instance
 */
@Injectable({ lifetime: 'transient' })
export class DataSet<T> implements Disposable {
  public dispose() {
    this.onEntityAdded.dispose()
    this.onEntityRemoved.dispose()
    this.onEntityUpdated.dispose()
  }

  /**
   * Primary key of the contained entity
   */
  public primaryKey: keyof T = this.settings.physicalStore.primaryKey

  /**
   * Adds an entity to the DataSet
   *
   * @param injector The injector from the context
   * @param entities The entities to add
   * @returns The CreateResult with the created entities
   */
  public async add(
    injector: Injector,
    ...entities: Array<WithOptionalId<T, this['primaryKey']>>
  ): Promise<CreateResult<T>> {
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
    createResult.created.map((entity) => this.onEntityAdded.setValue({ injector, entity }))
    return createResult
  }

  /**
   * Observable that will be updated after the entity has been persisted
   */
  public readonly onEntityAdded = new ObservableValue<{ injector: Injector; entity: T }>()

  /**
   * Updates an entity in the store
   *
   * @param injector The injector from the context
   * @param id The identifier of the entity
   * @param change The update
   */
  public async update(injector: Injector, id: T[this['primaryKey']], change: Partial<T>): Promise<void> {
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
    this.onEntityUpdated.setValue({ injector, change: parsed, id })
  }

  /**
   * Observable that will be updated right after an entity update
   */
  public readonly onEntityUpdated = new ObservableValue<{ injector: Injector; id: T[keyof T]; change: Partial<T> }>()

  /**
   * Returns a Promise with the entity count
   *
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
   *
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
   *
   * @param injector The injector from the context
   * @param key The identifier of the entity
   * @param select A field list used for projection
   *
   * @returns An item with the current unique key or Undefined
   */
  public async get(injector: Injector, key: T[this['primaryKey']], select?: Array<keyof T>) {
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
   *
   * @param injector The Injector from the context
   * @param key The primary key
   * @returns A promise that will be resolved / rejected based on the remove success
   */
  public async remove(injector: Injector, key: T[this['primaryKey']]): Promise<void> {
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
    this.onEntityRemoved.setValue({ injector, key })
  }

  /**
   * Callback that fires right after entity update
   */
  public readonly onEntityRemoved = new ObservableValue<{
    injector: Injector
    key: T[keyof T]
  }>()

  constructor(public readonly settings: DataSetSettings<T, keyof T>) {}
}

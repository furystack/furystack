import { Injectable, Injector } from '@furystack/inject'
import { AuthorizationError, SearchOptions, PartialResult, FilterType } from '@furystack/core'
import { DataSetSettings } from './data-set-setting'

/**
 * An authorized Repository Store instance
 */
@Injectable({ lifetime: 'transient' })
export class DataSet<T> {
  /**
   * Primary key of the contained entity
   */
  public primaryKey: keyof T = this.settings.physicalStore.primaryKey

  /**
   * Adds an entity to the DataSet
   *
   * @param injector The injector from the context
   * @param entity The entity to add
   */
  public async add(injector: Injector, entity: T): Promise<T> {
    if (this.settings.authorizeAdd) {
      const result = await this.settings.authorizeAdd({ injector, entity })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    const parsed = this.settings.modifyOnAdd ? await this.settings.modifyOnAdd({ injector, entity }) : entity
    const created = await this.settings.physicalStore.add(parsed)
    this.settings.onEntityAdded && this.settings.onEntityAdded({ injector, entity: created })
    return created
  }

  /**
   * Updates an entity in the store
   *
   * @param injector The injector from the context
   * @param id The identifier of the entity
   * @param change The update
   */
  public async update(injector: Injector, id: T[this['primaryKey']], change: T): Promise<void> {
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
      ? await this.settings.modifyOnUpdate({ injector, entity: change })
      : change
    await this.settings.physicalStore.update(id, parsed)
    this.settings.onEntityUpdated && this.settings.onEntityUpdated({ injector, change: parsed, id })
  }

  /**
   * Returns a Promise with the entity count
   *
   * @param injector The Injector from the context
   * @param filter The Filter that will be applied
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
   */
  public async filter<TFields extends Array<keyof T>>(
    injector: Injector,
    filter: SearchOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields[number]>>> {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    const parsedFilter = this.settings.addFilter ? await this.settings.addFilter({ injector, filter }) : filter
    return this.settings.physicalStore.search(parsedFilter)
  }

  /**
   * Returns an entity based on its primary key
   *
   * @param injector The injector from the context
   * @param key The identifier of the entity
   */
  public async get(injector: Injector, key: T[this['primaryKey']]) {
    if (this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw new AuthorizationError(result.message)
      }
    }
    const instance = await this.settings.physicalStore.get(key)
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
    return await this.settings.physicalStore.remove(key)
  }

  constructor(public readonly settings: DataSetSettings<T>) {}
}

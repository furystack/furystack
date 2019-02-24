import { ILogger } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { RepositoryStoreSettings } from './RepositoryStoreSettings'

/**
 * An authorized Repository Store instance
 */
export class RepositoryStore<T, TKey extends keyof T, TFilter> {
  public primaryKey: TKey = this.settings.physicalStore.primaryKey
  public logger: ILogger = this.settings.physicalStore.logger

  public async add(injector: Injector, entity: T): Promise<T> {
    if (this.settings) {
      if (this.settings.authorizeAdd) {
        const result = await this.settings.authorizeAdd({ injector, entity })
        if (!result.isAllowed) {
          throw Error(result.message ? result.message : `Cannot add entity.`)
        }
      }
    }
    const parsed =
      this.settings && this.settings.modifyOnAdd ? await this.settings.modifyOnAdd({ injector, entity }) : entity
    const created = await this.settings.physicalStore.add(parsed)
    this.settings && this.settings.onEntityAdded && this.settings.onEntityAdded({ injector, entity: created })
    return created
  }
  public async update(injector: Injector, id: T[this['primaryKey']], change: T): Promise<void> {
    if (this.settings) {
      if (this.settings.authorizeUpdate) {
        const result = await this.settings.authorizeUpdate({ injector, change })
        if (!result.isAllowed) {
          throw Error(result.message ? result.message : `Cannot update entity`)
        }
      }
      if (this.settings.authorizeUpdateEntity) {
        const entity = await this.settings.physicalStore.get(id)
        if (entity) {
          const result = await this.settings.authorizeUpdateEntity({ injector, change, entity })
          if (!result.isAllowed) {
            throw Error(result.message ? result.message : `Cannot update entity`)
          }
        }
      }
    }
    await this.settings.physicalStore.update(id, change)
    this.settings && this.settings.onEntityUpdated && this.settings.onEntityUpdated({ injector, change, id })
  }
  public async count(injector: Injector): Promise<number> {
    if (this.settings && this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw Error(result.message ? result.message : 'Cannot retrieve count')
      }
    }
    return await this.settings.physicalStore.count()
  }
  public async filter(injector: Injector, filter: TFilter) {
    if (this.settings && this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw Error(result.message ? result.message : 'Cannot retrieve entity collection')
      }
    }
    const parsedFilter =
      this.settings && this.settings.addFilter ? await this.settings.addFilter({ injector, filter }) : filter
    return this.settings.physicalStore.filter(parsedFilter)
  }
  public async get(injector: Injector, key: T[this['primaryKey']]) {
    if (this.settings && this.settings.authorizeGet) {
      const result = await this.settings.authorizeGet({ injector })
      if (!result.isAllowed) {
        throw Error(result.message ? result.message : 'Cannot retrieve entity instance')
      }
    }
    const instance = await this.settings.physicalStore.get(key)
    if (instance && this.settings && this.settings.authorizeGetEntity) {
      const result = await this.settings.authorizeGetEntity({ injector, entity: instance })
      if (!result.isAllowed) {
        throw Error(result.message ? result.message : 'Cannot retrieve entity instance')
      }
    }
    return instance
  }
  public async remove(injector: Injector, key: T[this['primaryKey']]): Promise<void> {
    if (this.settings && this.settings.authorizeRemove) {
      const result = await this.settings.authorizeRemove({ injector })
      if (!result.isAllowed) {
        throw Error(result.message ? result.message : 'Cannot remove entity instance')
      }
      if (this.settings.authroizeRemoveEntity) {
        const entity = await this.settings.physicalStore.get(key)
        if (entity) {
          const removeResult = await this.settings.authroizeRemoveEntity({ injector, entity })
          if (!removeResult.isAllowed) {
            throw Error(removeResult.message ? removeResult.message : 'Cannot remove entity instance')
          }
        }
      }
    }
  }
  public dispose() {
    /** */
  }

  constructor(public readonly settings: RepositoryStoreSettings<T, TKey, TFilter>) {}
}

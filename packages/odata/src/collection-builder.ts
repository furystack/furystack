import { Collection } from './models/collection'

/**
 * Builder class for OData Entities
 */
export class CollectionBuilder {
  public readonly collections: Map<string, Collection<any>> = new Map()

  public addCollection<T>(collection: Collection<T>) {
    this.collections.set(collection.name || collection.model.name, collection)
    return this
  }
}

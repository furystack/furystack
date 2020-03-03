import { Collection } from './models/collection'

/**
 * Builder class for OData Collections
 */
export class CollectionBuilder {
  public readonly collections: Map<string, Collection<any>> = new Map()

  /**
   * Adds a collection instance
   *
   * @param collection The Collection to add
   * @returns the builder instance
   */
  public addCollection<T>(collection: Collection<T>) {
    this.collections.set(collection.name || collection.model.name, {
      ...collection,
    })
    return this
  }
}

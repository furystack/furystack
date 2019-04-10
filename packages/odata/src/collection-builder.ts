import { OdataCount } from './actions/count'
import { Collection } from './models/collection'

/**
 * Builder class for OData Entities
 */
export class CollectionBuilder {
  public readonly collections: Map<string, Collection<any>> = new Map()

  public addCollection<T>(collection: Collection<T>) {
    collection.functions = {
      ...collection.functions,
      $count: {
        action: OdataCount,
        isBound: true,
        returnType: Number,
      },
    }

    this.collections.set(collection.name || collection.model.name, {
      ...collection,
    })
    return this
  }
}

import { Entity } from './models/entity'

/**
 * Builder class for OData Entities
 */
export class EntityTypeBuilder {
  public readonly entities: Map<string, Entity<any>> = new Map()

  public addEntityType<T>(entity: Entity<T>) {
    this.entities.set(entity.name || entity.model.name, entity)
    return this
  }
}

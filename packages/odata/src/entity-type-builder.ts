import { Entity } from './models/entity'

/**
 * Builder class for OData Entities
 */
export class EntityTypeBuilder {
  public readonly entities: Map<string, Entity<any>> = new Map()

  /**
   * Adds an entity type to the builder
   *
   * @param entity The type to add
   * @returns the builder instance for chaining
   */
  public addEntityType<T>(entity: Entity<T>) {
    this.entities.set(entity.name || entity.model.name, entity)
    return this
  }
}

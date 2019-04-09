/**
 * Defines a simple property of an entity
 */
export interface EntityProperty {
  /**
   * Name of the Entity
   */
  name: string

  /**
   * The EDM type name
   */
  type: string

  /**
   * The field is nullable
   */
  nullable?: boolean
}

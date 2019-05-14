/**
 * Representation of an application role
 */
export interface IRole {
  /**
   * Name of the role
   */
  name: string

  /**
   * User friendly display name of the role
   */
  displayName?: string

  /**
   * Short, meaningful description
   */
  description?: string
}

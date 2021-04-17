/**
 * Endpoint model for getting a single entity
 */
export type GetEntityEndpoint<T> = {
  query: {
    /**
     * The list of fields to select
     */
    select?: Array<keyof T>
  }
  url: {
    /**
     * The entity's unique identifier
     */
    id: T[keyof T]
  }
  result: T
}

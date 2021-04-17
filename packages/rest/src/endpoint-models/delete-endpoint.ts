/**
 * Endpoint model for deleting entities
 */
export type DeleteEndpoint<T, TPrimaryKey extends keyof T> = {
  url: { id: T[TPrimaryKey] }
  result: {}
}

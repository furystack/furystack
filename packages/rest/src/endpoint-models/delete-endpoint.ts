/**
 * Endpoint model for deleting entities
 */
export type DeleteEndpoint<T> = {
  url: { id: T[keyof T] }
  result: {}
}

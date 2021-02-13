/**
 * Endpoint model for updating entities
 */
export type PatchEndpoint<T> = {
  body: T
  url: { id: T[keyof T] }
  result: {}
}

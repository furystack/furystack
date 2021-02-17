/**
 * Endpoint model for updating entities
 */
export type PatchEndpoint<T> = {
  body: Partial<T>
  url: { id: T[keyof T] }
  result: {}
}

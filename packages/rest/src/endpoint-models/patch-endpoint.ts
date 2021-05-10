/**
 * Endpoint model for updating entities
 */
export type PatchEndpoint<T, TPrimaryKey extends keyof T> = {
  body: Partial<T>
  url: { id: T[TPrimaryKey] }
  result: {}
}

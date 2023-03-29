/**
 * Endpoint model for updating entities
 */
export type PatchEndpoint<T, TPrimaryKey extends keyof T, TWritableData = Partial<T>> = {
  body: TWritableData
  url: { id: T[TPrimaryKey] }
  result: {}
}

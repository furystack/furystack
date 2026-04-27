/** PATCH-by-id endpoint contract. `TWritableData` defaults to `Partial<T>`. */
export type PatchEndpoint<T, TPrimaryKey extends keyof T, TWritableData = Partial<T>> = {
  body: TWritableData
  url: { id: T[TPrimaryKey] }
  result: object
}

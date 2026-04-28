/** DELETE-by-id endpoint contract. */
export type DeleteEndpoint<T, TPrimaryKey extends keyof T> = {
  url: { id: T[TPrimaryKey] }
  result: object
}

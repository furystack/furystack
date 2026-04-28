/** GET-by-id endpoint contract. `select` narrows the projected fields. */
export type GetEntityEndpoint<T, TPrimaryKey extends keyof T> = {
  query: { select?: Array<keyof T> }
  url: { id: T[TPrimaryKey] }
  result: T
}

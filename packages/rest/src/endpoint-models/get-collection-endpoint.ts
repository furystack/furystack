import type { FindOptions } from '@furystack/core'

/**
 * Collection result. `count` is the **total** matching entity count
 * (ignores `top` / `skip`); `entries` is the page returned for this query.
 */
export type GetCollectionResult<T> = {
  count: number
  entries: T[]
}

/** GET-collection endpoint contract. */
export type GetCollectionEndpoint<T> = {
  query: { findOptions?: FindOptions<T, Array<keyof T>> }
  result: GetCollectionResult<T>
}

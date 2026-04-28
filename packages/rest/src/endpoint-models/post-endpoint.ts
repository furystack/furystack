import type { WithOptionalId } from '@furystack/core'

/** POST endpoint contract. `TPostData` defaults to `T` with the primary key optional. */
export type PostEndpoint<T, TPrimaryKey extends keyof T, TPostData = WithOptionalId<T, TPrimaryKey>> = {
  body: TPostData
  result: T
}

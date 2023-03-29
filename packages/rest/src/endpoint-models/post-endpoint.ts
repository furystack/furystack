import type { WithOptionalId } from '@furystack/core'

/**
 * Endpoint model for creating new entities
 */
export type PostEndpoint<T, TPrimaryKey extends keyof T, TPostData = WithOptionalId<T, TPrimaryKey>> = {
  body: TPostData
  result: T
}

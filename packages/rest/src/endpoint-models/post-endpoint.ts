import { WithOptionalId } from '@furystack/core'

/**
 * Endpoint model for creating new entities
 */
export type PostEndpoint<T, TPrimaryKey extends keyof T> = {
  body: WithOptionalId<T, TPrimaryKey>
  result: T
}

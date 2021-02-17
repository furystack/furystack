import { WithOptionalId } from '@furystack/core'

/**
 * Endpoint model for creating new entities
 */
export type PostEndpoint<T> = {
  body: WithOptionalId<T, keyof T>
  result: T
}

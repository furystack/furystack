import { WithOptionalId } from '@furystack/core'
import { RequestAction } from '../request-action'

/**
 * Endpoint model for creating new entities
 */
export type PostEndpoint<T> = RequestAction<{
  body: WithOptionalId<T, keyof T>
  result: T
}>

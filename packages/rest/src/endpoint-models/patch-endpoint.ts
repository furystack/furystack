import { RequestAction } from '../request-action'

/**
 * Endpoint model for updating entities
 */
export type PatchEndpoint<T> = RequestAction<{
  body: T
  url: { id: T[keyof T] }
  result: {}
}>

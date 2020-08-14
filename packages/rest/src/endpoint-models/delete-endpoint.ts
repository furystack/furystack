import { RequestAction } from '../request-action'

/**
 * Endpoint model for deleting entities
 */
export type DeleteEndpoint<T> = RequestAction<{
  urlParams: { id: T[keyof T] }
  result: string
}>

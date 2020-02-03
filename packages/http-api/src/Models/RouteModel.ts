import { RequestAction } from './RequestAction'
import { Injector } from '@furystack/inject'

/**
 * Strategy for resolving actions from a route
 */
export type RouteModel = (
  /**
   * The injector instance
   */
  injector: Injector,
) => RequestAction | undefined

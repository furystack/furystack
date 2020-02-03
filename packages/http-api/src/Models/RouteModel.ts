import { Injector } from '@furystack/inject'
import { RequestAction } from './RequestAction'

/**
 * Strategy for resolving actions from a route
 */
export type RouteModel = (
  /**
   * The injector instance
   */
  injector: Injector,
) => RequestAction | undefined

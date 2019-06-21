import { IncomingMessage } from 'http'
import { Constructable, Injector } from '@furystack/inject'
import { RequestAction } from './RequestAction'

/**
 * Strategy for resolving actions from a route
 */
export type RouteModel = (
  /**
   * The incoming request message
   */
  incomingMessage: IncomingMessage,

  /**
   * The injector instance
   */
  injector: Injector,
) => Constructable<RequestAction> | undefined

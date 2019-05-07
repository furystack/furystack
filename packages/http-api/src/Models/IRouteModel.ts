import { Constructable, Injector } from '@furystack/inject'
import { IncomingMessage } from 'http'
import { IRequestAction } from './IRequestAction'

/**
 * Strategy for resolving actions from a route
 */
export type IRouteModel = (
  /**
   * The incoming request message
   */
  incomingMessage: IncomingMessage,

  /**
   * The injector instance
   */
  injector: Injector,
) => Constructable<IRequestAction> | undefined

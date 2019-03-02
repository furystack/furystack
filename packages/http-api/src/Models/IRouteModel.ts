import { Constructable, Injector } from '@furystack/inject'
import { IncomingMessage } from 'http'
import { IRequestAction } from './IRequestAction'

/**
 * Strategy for resolving actions from a route
 */
export type IRouteModel = (
  incomingMessage: IncomingMessage,
  injector: Injector,
) => Constructable<IRequestAction> | undefined

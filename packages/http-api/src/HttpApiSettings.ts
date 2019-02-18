import { UserContext } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { IncomingMessage, Server as HttpServer, ServerResponse } from 'http'
import { Server } from 'net'
import { ErrorAction } from './Actions/ErrorAction'
import { NotFoundAction } from './Actions/NotFoundAction'
import { HttpUserContext } from './HttpUserContext'
import { IRequestAction } from './Models'
import { ICorsOptions } from './Models/ICorsOptions'
/**
 * Configuration object for the FuryStack HTTP Api
 */
export interface HttpApiSettings {
  defaultAction: Constructable<IRequestAction>
  errorAction: Constructable<ErrorAction>
  hostName: string
  serverFactory: (requestListener: (incomingMessage: IncomingMessage, serverResponse: ServerResponse) => void) => Server
  notFoundAction: Constructable<NotFoundAction>
  actions: Array<(incomingMessage: IncomingMessage) => Constructable<IRequestAction> | undefined>
  port: number
  protocol: 'http' | 'https'
  perRequestServices: Array<{ key: Constructable<any>; value: Constructable<any> }>
  corsOptions: ICorsOptions
}

/**
 * Default settings for HTTP API
 */
export const defaultHttpApiSettings: HttpApiSettings = {
  defaultAction: NotFoundAction,
  errorAction: ErrorAction,
  hostName: 'localhost',
  serverFactory: listener => new HttpServer(listener),
  notFoundAction: NotFoundAction,
  actions: [],
  port: 8080,
  protocol: 'http',
  perRequestServices: [
    {
      key: UserContext,
      value: HttpUserContext,
    },
  ],
  corsOptions: {
    origins: [],
  },
}

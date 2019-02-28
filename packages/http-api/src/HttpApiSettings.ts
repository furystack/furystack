import { UserContext } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { IncomingMessage } from 'http'
import { ErrorAction } from './Actions/ErrorAction'
import { NotFoundAction } from './Actions/NotFoundAction'
import { HttpUserContext } from './HttpUserContext'
import { IRequestAction } from './Models'
import { ICorsOptions } from './Models/ICorsOptions'
/**
 * Configuration object for the FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpApiSettings {
  public defaultAction: Constructable<IRequestAction> = NotFoundAction
  public errorAction: Constructable<ErrorAction> = ErrorAction
  public hostName: string = 'localhost'
  public notFoundAction: Constructable<NotFoundAction> = NotFoundAction
  public actions: Array<(incomingMessage: IncomingMessage) => Constructable<IRequestAction> | undefined> = []
  public port: number = 8080
  public protocol: 'http' | 'https' = 'http'
  public perRequestServices: Array<{ key: Constructable<any>; value: Constructable<any> }> = [
    {
      key: UserContext,
      value: HttpUserContext,
    },
  ]
  public corsOptions: ICorsOptions = {
    origins: [],
  }
}

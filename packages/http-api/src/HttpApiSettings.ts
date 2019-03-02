import { Constructable, Injectable } from '@furystack/inject'
import { ErrorAction } from './Actions/ErrorAction'
import { NotFoundAction } from './Actions/NotFoundAction'
import { ICorsOptions } from './Models/ICorsOptions'
import { IRequestAction } from './Models/IRequestAction'
import { IRouteModel } from './Models/IRouteModel'

/**
 * Configuration object for the FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpApiSettings {
  public defaultAction: Constructable<IRequestAction> = NotFoundAction
  public errorAction: Constructable<ErrorAction> = ErrorAction
  public hostName: string = 'localhost'
  public notFoundAction: Constructable<NotFoundAction> = NotFoundAction
  public actions: IRouteModel[] = []
  public port: number = 8080
  public protocol: 'http' | 'https' = 'http'
  public corsOptions: ICorsOptions = {
    origins: [],
  }
}

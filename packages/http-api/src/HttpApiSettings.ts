import { Constructable, Injectable } from '@furystack/inject'
import { ErrorAction } from './Actions/ErrorAction'
import { NotFoundAction } from './Actions/NotFoundAction'
import { CorsOptions } from './Models/CorsOptions'
import { RequestAction } from './Models/RequestAction'
import { RouteModel } from './Models/RouteModel'

/**
 * Configuration object for the FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpApiSettings {
  public defaultAction: Constructable<RequestAction> = NotFoundAction
  public errorAction: Constructable<ErrorAction> = ErrorAction
  public hostName: string = 'localhost'
  public notFoundAction: Constructable<NotFoundAction> = NotFoundAction
  public actions: RouteModel[] = []
  public port: number = 8080
  public protocol: 'http' | 'https' = 'http'
  public corsOptions: CorsOptions = {
    origins: [],
  }
}

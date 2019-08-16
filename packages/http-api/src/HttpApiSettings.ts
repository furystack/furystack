import { Injectable } from '@furystack/inject'
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
  public defaultAction: RequestAction = NotFoundAction
  public errorAction: RequestAction = ErrorAction
  public hostName = 'localhost'
  public notFoundAction: RequestAction = NotFoundAction
  public actions: RouteModel[] = []
  public port = 8080
  public protocol: 'http' | 'https' = 'http'
  public corsOptions: CorsOptions = {
    origins: [],
  }
}

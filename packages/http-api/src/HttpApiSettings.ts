import { RequestAction, RouteModel, CorsOptions } from './Models'
import { NotFoundAction, ErrorAction } from './Actions'
import { Injectable } from '@furystack/inject'

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

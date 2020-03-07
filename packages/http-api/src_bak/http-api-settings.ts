import { Injectable } from '@furystack/inject'
import { RequestAction, RouteModel, CorsOptions } from './models'
import { NotFoundAction, ErrorAction } from './actions'

/**
 * Configuration object for the FuryStack HTTP Api
 */
@Injectable({ lifetime: 'singleton' })
export class HttpApiSettings {
  public defaultAction: RequestAction = NotFoundAction
  public errorAction: RequestAction = ErrorAction
  public notFoundAction: RequestAction = NotFoundAction
  public actions: RouteModel[] = []
  public corsOptions: CorsOptions = {
    origins: [],
  }
}

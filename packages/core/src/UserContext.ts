import { Injectable } from '@furystack/inject'
import { IUser } from './Models'

/**
 * Placeholder injectable class for the User context
 */
@Injectable()
export class UserContext<T extends IUser = IUser> {
  public async GetCurrentUser(): Promise<T> {
    throw Error('The UserContext is not implemented')
  }
}

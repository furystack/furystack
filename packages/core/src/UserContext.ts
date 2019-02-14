import { Injectable } from '@furystack/inject'
import { IUser } from './Models/IUser'

/**
 * Placeholder injectable class for the User context
 */
@Injectable()
export class UserContext<T extends IUser = IUser> {
  public async getCurrentUser(): Promise<T> {
    throw Error('The UserContext is not implemented')
  }
}

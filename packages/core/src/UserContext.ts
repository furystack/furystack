import { Injectable } from '@furystack/inject'
import { IUser } from './Models/IUser'
import { IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Placeholder injectable class for the User context
 */
@Injectable()
export class UserContext<T extends IUser = IUser> {
  public users: IPhysicalStore<T> = null as any

  public async getCurrentUser(): Promise<T> {
    throw Error('The UserContext is not implemented')
  }
}

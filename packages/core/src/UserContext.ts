import { Injectable } from '@furystack/inject'
import { IPhysicalStore } from './Models/IPhysicalStore'
import { IUser } from './Models/IUser'

/**
 * Placeholder injectable class for the User context
 */
@Injectable({ lifetime: 'scoped' })
export class UserContext<T extends IUser = IUser> {
  public users: IPhysicalStore<T> = null as any

  public async getCurrentUser(): Promise<T> {
    throw Error('The UserContext is not implemented')
  }
}

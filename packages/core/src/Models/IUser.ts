import { SystemRoles } from '../SystemRoles'
import { IRole } from './IRole'

/**
 * The default unauthenticated user
 */
export const visitorUser: IUser = {
  username: 'Visitor',
  roles: [SystemRoles.visitors],
}

/**
 * Interface that represents an application user
 */
export interface IUser {
  username: string
  roles: IRole[]
}

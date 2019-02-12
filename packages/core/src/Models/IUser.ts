import { SystemRoles } from '../SystemRoles'
import { IRole } from './IRole'

/**
 * The default unauthenticated user
 */
export const visitorUser: IUser = {
  Username: 'Visitor',
  Roles: [SystemRoles.Visitors],
}

/**
 * Interface that represents an application user
 */
export interface IUser {
  Username: string
  Roles: IRole[]
}

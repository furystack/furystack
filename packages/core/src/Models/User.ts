import { SystemRoles } from '../SystemRoles'
import { IRole } from './IRole'

/**
 * The default unauthenticated user
 */
export const visitorUser: User = {
  username: 'Visitor',
  roles: [SystemRoles.visitors],
}

/**
 * Class model that represents an application user
 */
export class User {
  /**
   * Name of the user
   */
  public username!: string

  /**
   * List of roles
   */
  public roles!: IRole[]
}

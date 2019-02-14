import { IRole } from './Models/IRole'
/**
 * Static store for system roles
 */
export class SystemRoles {
  public static visitors: IRole = {
    name: 'Visitor',
    displayName: 'The user is a Visitor',
    description: 'Roles applied for non-authenticated users',
  }

  public static authenticatedUsers: IRole = {
    name: 'Authenticated',
    displayName: 'Authenticated users',
    description: 'The user is logged in with a valid account',
  }
}

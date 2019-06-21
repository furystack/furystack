import { Role } from './Models/Role'
/**
 * Static store for system roles
 */
export class SystemRoles {
  public static visitors: Role = {
    name: 'Visitor',
    displayName: 'The user is a Visitor',
    description: 'Roles applied for non-authenticated users',
  }

  public static authenticatedUsers: Role = {
    name: 'Authenticated',
    displayName: 'Authenticated users',
    description: 'The user is logged in with a valid account',
  }
}

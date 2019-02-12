import { Injectable } from '@furystack/inject'
import { Role, User } from './ContentTypes'
import { ISavedContent } from './models'

/**
 * Container for generic system content
 */
@Injectable()
export class SystemContent {
  public VisitorRole = { Id: 1, Name: 'Visitor', DisplayName: 'Visitor Role' } as ISavedContent<Role>
  public AuthenticatedRole = { Id: 2, Name: 'Authenticated', DisplayName: 'Authenticated Role' } as ISavedContent<Role>
  public AdminRole = { Id: 3, Name: 'Admin', DisplayName: 'Administrator Role' } as ISavedContent<Role>
  public VisitorUser = ({
    Id: 4,
    Username: 'Visitor',
    Password: '',
    Roles: [this.VisitorRole],
  } as any) as ISavedContent<User>
  public AdminUser = ({
    Id: 5,
    Username: 'Admin',
    Password: '',
    Roles: [this.AuthenticatedRole, this.AdminRole],
  } as any) as ISavedContent<User>
}

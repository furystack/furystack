import { Injectable } from '@furystack/inject'
import { Role, User } from './ContentTypes'
import { ISavedContent } from './models'

/**
 * Container for generic system content
 */
@Injectable()
export class SystemContent {
  public visitorRole = { id: 1, name: 'Visitor', displayName: 'Visitor Role' } as ISavedContent<Role>
  public authenticatedRole = { id: 2, name: 'Authenticated', displayName: 'Authenticated Role' } as ISavedContent<Role>
  public adminRole = { id: 3, name: 'Admin', displayName: 'Administrator Role' } as ISavedContent<Role>
  public visitorUser = ({
    Id: 4,
    Username: 'Visitor',
    Password: '',
    Roles: [this.visitorRole],
  } as any) as ISavedContent<User>
  public adminUser = ({
    Id: 5,
    Username: 'Admin',
    Password: '',
    Roles: [this.authenticatedRole, this.adminRole],
  } as any) as ISavedContent<User>
}

import { IRole, IUser } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { Content, ContentPermission, ContentType, ContentTypePermission, ISavedContent } from './models'

/**
 * Manager class for role evaluation
 */
@Injectable()
export class RoleManager<TUser extends ISavedContent<IUser> = ISavedContent<IUser>, TRole extends IRole = IRole> {
  public async HasRole(user: TUser, role: TRole): Promise<boolean> {
    return user.Roles && user.Roles.filter(r => r.Name === role.Name).length === 1 ? true : false
  }

  public async HasPermissionForType(options: {
    user: TUser
    contentType: ContentType
    permission: ContentTypePermission['Type']
  }): Promise<boolean> {
    return options.contentType.Permissions &&
      options.contentType.Permissions.filter(p => p.Identity.Id === options.user.Id && p.Type === options.permission)
        .length > 0
      ? true
      : false
  }

  public async HasPermissionForContent(options: {
    user: TUser
    content: Content
    permission: ContentPermission['Type']
  }) {
    return options.content.Permissions &&
      options.content.Permissions.filter(p => p.Identity.Id === options.user.Id && p.Type === options.permission).length
      ? true
      : false
  }
}

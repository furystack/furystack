import { IRole, IUser } from '@furystack/core'
import { Injectable } from '@furystack/inject'
import { Content, ContentPermission, ContentType, ContentTypePermission, ISavedContent } from './models'

/**
 * Manager class for role evaluation
 */
@Injectable()
export class RoleManager<TUser extends ISavedContent<IUser> = ISavedContent<IUser>, TRole extends IRole = IRole> {
  public async hasRole(user: TUser, role: TRole): Promise<boolean> {
    return user.roles && user.roles.filter(r => r.name === role.name).length === 1 ? true : false
  }

  public async hasPermissionForType(options: {
    user: TUser
    contentType: ContentType
    permission: ContentTypePermission['type']
  }): Promise<boolean> {
    return options.contentType.permissions &&
      options.contentType.permissions.filter(p => p.identity.id === options.user.id && p.type === options.permission)
        .length > 0
      ? true
      : false
  }

  public async hasPermissionForContent(options: {
    user: TUser
    content: Content
    permission: ContentPermission['type']
  }) {
    return options.content.permissions &&
      options.content.permissions.filter(p => p.identity.id === options.user.id && p.type === options.permission).length
      ? true
      : false
  }
}

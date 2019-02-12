import { IContent } from './IContent'
import { IContentType } from './IContentType'
import { IEntity } from './IEntity'
import { IJob } from './IJob'
import { IJobType } from './IJobType'
import { IPermissionType } from './IPermissionType'

/**
 * Model that defines a permission
 */

export interface IPermission extends IEntity {
  IdentityType: 'user' | 'role'
  IdentityId: number
  User: Promise<IContent>
  PermissionType: Promise<IPermissionType>
  Content?: Promise<IContent>
  Job?: Promise<IJob>
  ContentType?: Promise<IContentType>
  JobType?: Promise<IJobType>
}

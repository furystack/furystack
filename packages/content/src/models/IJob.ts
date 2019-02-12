import { IAspect } from './IAspect'
import { IContent } from './IContent'
import { INamedEntity } from './INamedEntity'
import { IPermission } from './IPermission'

/**
 * Model that defines a job instance
 */

export interface IJob extends INamedEntity {
  Description: string
  Completed: boolean
  Content: Promise<IContent>
  Prerequisites: Promise<IJob[]>
  Aspect: Promise<IAspect>
  Permissions: Promise<IPermission[]>
}

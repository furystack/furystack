import { IContent } from './IContent'
import { IEntity } from './IEntity'
import { IReferenceType } from './IReferenceType'

/**
 * Model that defines a reference
 */

export interface IReference extends IEntity {
  Type: Promise<IReferenceType>
  Content: Promise<IContent>
  References: Promise<IContent[]>
}

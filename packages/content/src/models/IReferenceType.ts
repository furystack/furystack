import { IContentType } from './IContentType'
import { INamedEntity } from './INamedEntity'

/**
 * Model that defines a reference
 */
export interface IReferenceType extends INamedEntity {
  Description: string
  Category: string
  ContentType: Promise<IContentType>
  AllowedTypes: Promise<IContentType[]>
}

import { IAspectField } from './IAspectField'
import { IContentType } from './IContentType'
import { INamedEntity } from './INamedEntity'

/**
 * Model that defines a field type
 */

export interface IFieldType extends INamedEntity {
  Description: string
  DefaultValue: string
  Unique: boolean
  Category: string
  ContentType: Promise<IContentType>
  AspectFields: Promise<IAspectField[]>
}

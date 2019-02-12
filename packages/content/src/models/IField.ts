import { IContent } from './IContent'
import { IEntity } from './IEntity'
import { IFieldType } from './IFieldType'
/**
 * Model that defines a field
 */
export interface IField extends IEntity {
  Value: string
  Type: Promise<IFieldType>
  Content: Promise<IContent>
}

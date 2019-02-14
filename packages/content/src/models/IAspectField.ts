import { IAspect } from './IAspect'
import { IFieldType } from './IFieldType'

/**
 * Model that defines an aspect field
 */
export interface IAspectField {
  id: number
  fieldType: Promise<IFieldType>
  category: string
  order: number
  readOnly: boolean
  required: boolean
  controlName: string
  aspect: Promise<IAspect>
}

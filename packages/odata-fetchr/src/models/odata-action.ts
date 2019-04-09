import { OdataParameter } from './odata-parameter'

/**
 * Model that defines an odata Action model
 */
export interface OdataAction {
  name: string
  function: string
  returnType?: string
  isBound?: boolean
  parameters?: OdataParameter[]
}

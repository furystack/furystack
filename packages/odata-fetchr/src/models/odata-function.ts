import { OdataParameter } from './odata-parameter'

/**
 * Model that defines an odata function model
 */
export interface OdataFunction {
  name: string
  function: string
  returnType: string
  isBound?: boolean
  parameters?: OdataParameter[]
}

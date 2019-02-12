import { INamedEntity } from './INamedEntity'

/**
 * Model that defines a permission type
 */

export interface IPermissionType extends INamedEntity {
  Description: string
  Category: string
}

import { IEntity } from './IEntity'
/**
 * Abstract for named entities
 */

export interface INamedEntity extends IEntity {
  Name: string
  DisplayName: string
}

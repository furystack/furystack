import { Constructable } from '@furystack/inject'
import { IApi } from './IApi'

/**
 * defines the options for instantiating a FuryStack instance
 */
export interface IFuryStackOptions {
  /**
   * A collection of APIs to use
   */
  apis: Iterable<Constructable<IApi>>
}

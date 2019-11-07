import { ODataFilterConnection } from './odata-filter-connection'
import { ODataFilterExpression } from './odata-filter-expression'

type FilterSegment<T> = ODataFilterExpression<T> | ODataFilterConnection<T>

/**
 * Class for building Odata Filters
 */
export class ODataFilterBuilder<T> {
  public filterSegments: Array<FilterSegment<T>> = []

  /**
   * Factory method for creating ODataFilterBuilders
   * @returns The first ODataFilterExpression value for the ODataFilterBuilder
   */
  public static create<T>(): ODataFilterExpression<T> {
    const builder = new ODataFilterBuilder<T>()
    const firstSegment = new ODataFilterExpression(builder)
    return firstSegment
  }

  /**
   * Evaluates the ODataFilterBuilder<T>'s segments into a parsed OData Filter expression
   * @returns The Filter query expression
   */
  public toString(): string {
    return this.filterSegments.map(s => s.toString()).join(' ')
  }
}

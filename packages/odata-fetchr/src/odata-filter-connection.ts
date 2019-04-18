import { ODataFilterBuilder } from './odata-filter-builder'
import { ODataFilterExpression } from './odata-filter-expression'

/**
 * Model for OData Filter Connection
 */
export class ODataFilterConnection<T> {
  private type: 'and' | 'or' = 'and'
  constructor(public filterBuilderRef: ODataFilterBuilder<T>) {}

  /**
   * Sets the connection between OData Filter expression segments to 'AND' type
   * @returns The next ODataFilterExpression (Fluent)
   */
  public get and() {
    this.type = 'and'
    this.filterBuilderRef.filterSegments.push(this)
    return new ODataFilterExpression<T>(this.filterBuilderRef)
  }

  /**
   * Sets the connection between OData Filter expression segments to 'OR' type
   * @returns The next ODataFilterExpression (Fluent)
   */
  public get or() {
    this.type = 'or'
    this.filterBuilderRef.filterSegments.push(this)
    return new ODataFilterExpression<T>(this.filterBuilderRef)
  }

  public toString() {
    return this.type
  }
}

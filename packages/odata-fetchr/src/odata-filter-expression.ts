import { ODataFilterBuilder } from './odata-filter-builder'
import { ODataFilterConnection } from './odata-filter-connection'

/**
 * OData Filter Expression class
 */
export class ODataFilterExpression<T> {
  private value = ''

  private getFilterValueSegment(value: any): string {
    const castedValue = value.toString()
    if (typeof value === 'string' && !/^[0-9]*$/.test(castedValue)) {
      return `('${castedValue}')`
    }

    return `(${castedValue})`
  }

  constructor(public filterBuilderRef: ODataFilterBuilder<T>) {}

  private finialize() {
    this.filterBuilderRef.filterSegments.push(this)
    return new ODataFilterConnection<T>(this.filterBuilderRef)
  }

  /**
   * Creates an instance of an Equals (~eq) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */

  public equals<K extends keyof T>(field: K, value: any) {
    this.value = `${field} eq ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of an Not Equals (~ne) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public notEquals<K extends keyof T>(field: K, value: any) {
    this.value = `${field} ne ${this.getFilterValueSegment(value)}'`
    return this.finialize()
  }

  /**
   * Creates an instance of a Greater Than (~gt) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public greaterThan<K extends keyof T>(field: K, value: any) {
    this.value = `${field} gt ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of a Greater Than or Equals (~ge) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public greaterThanOrEquals<K extends keyof T>(field: K, value: any) {
    this.value = `${field} ge ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of a Lesser Than (~lt) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public lessThan<K extends keyof T>(field: K, value: any) {
    this.value = `${field} lt ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of a Lesser Than or equals (~le) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public lessThanOrEquals<K extends keyof T>(field: K, value: any) {
    this.value = `${field} le ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of a HAS (~has) filter segment
   *
   * @param field The name of the field to check (String literal)
   * @param value The value to check
   * @returns The next ODataFilterConnection (Fluent)
   */
  public has<K extends keyof T>(field: K, value: any) {
    this.value = `${field} has ${this.getFilterValueSegment(value)}`
    return this.finialize()
  }

  /**
   * Creates an instance of a nested negated (~not) FilterBuilder object
   *
   * @param build The fluent chain for the filter expression
   * @returns The next ODataFilterConnection (Fluent)
   */
  public not(build: (b: ODataFilterExpression<T>) => void) {
    const builder = ODataFilterBuilder.create<T>()
    build(ODataFilterBuilder.create<T>())
    this.value = `not (${builder.toString()})`
    return this.finialize()
  }

  /**
   * Creates an instance of a nested FilterBuilder object
   *
   * @param build The fluent chain for the filter expression
   * @returns The next ODataFilterConnection (Fluent)
   */
  public buildFilter(build: (b: ODataFilterExpression<T>) => void) {
    const builder = ODataFilterBuilder.create<T>()
    build(ODataFilterBuilder.create<T>())
    this.value = `(${builder.toString()})`
    return this.finialize()
  }

  /**
   * Gets the evaluated OData filter segment
   *
   * @returns The OData filter segment
   */
  public toString(): string {
    return this.value
  }
}

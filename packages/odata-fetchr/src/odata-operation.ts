/**
 * Abstract class for Odata operations
 */
export abstract class ODataOperation<T> {
  protected _expand!: string
  protected _select!: string

  /**
   * Sets the OData $expand= property
   *
   * @param expand The field name(s) to be expanded
   * @returns the operation instance for chaining
   */
  public expand<K extends keyof T>(...expand: K[]) {
    this._expand = this.parseStringOrStringArray(...expand)
    return this
  }

  /**
   * Sets the OData $select= property
   *
   * @param select The field name(s) to be included in the OData Select
   * @returns the operation instance for chaining
   */
  public select<K extends keyof T>(...select: K[]) {
    this._select = this.parseStringOrStringArray(...select)
    return this
  }

  /**
   * Executes the operation, should return an awaitable Promise
   */
  public abstract exec(): Promise<any>

  protected parseStringOrStringArray(...input: Array<string | number | symbol>): string {
    if (input instanceof Array) {
      return input.join(',')
    }

    return input as string
  }
}

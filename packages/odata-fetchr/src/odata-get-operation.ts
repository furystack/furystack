import { ODataOperation } from './odata-operation'

/**
 * Model for OData Get Operation
 */
export class ODataGetOperation<T> extends ODataOperation<T> {
  constructor(private evaluate: (queryString: string) => Promise<T>) {
    super()
  }

  /**
   * Executes the Get operation
   *
   * @returns An awaitable Promise<T>
   */
  public async exec(): Promise<T> {
    const queryUrl = this.buildQueryUrl()
    return await this.evaluate(queryUrl)
  }

  private buildQueryUrl(): string {
    let url = '?'
    if (this._expand) {
      url += `$expand=${this._expand}&`
    }
    if (this._select) {
      url += `$expand=${this._select}&`
    }
    if (url === '?') {
      url = ''
    }
    return url
  }
}

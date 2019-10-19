/**
 * OData Error model
 */
export class ODataError<T> implements Error {
  public name: string
  public message: string

  constructor(public readonly response: Response, public readonly body: T) {
    this.name = 'OData Request Error'
    this.message = response.statusText
  }
}

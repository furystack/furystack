/**
 * OData Error model
 */
export class ODataError implements Error {
  public response: any
  public name: string
  public message: string

  constructor(response: Response) {
    this.name = 'OData Request Error'
    this.message = response.statusText
  }
}

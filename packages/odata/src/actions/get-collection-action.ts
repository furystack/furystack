import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { ServerResponse } from 'http'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class GetCollectionAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor(this.context.collection.name)
    const value = await dataSet.filter(this.injector, {})
    const count = await dataSet.count(this.injector)
    this.response.setHeader('content-type', 'application/json')
    this.response.end(
      JSON.stringify({
        '@odata.context': 'ToDo',
        '@odata.count': count,
        '@odata.nextLink': 'ToDo',
        value,
      }),
    )
  }
  constructor(
    private repo: Repository,
    private context: OdataContext<any>,
    private injector: Injector,
    private response: ServerResponse,
  ) {}
}

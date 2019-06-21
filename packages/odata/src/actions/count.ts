import { ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { OdataContext } from '../odata-context'

/**
 * OData Count action
 */
@Injectable({ lifetime: 'transient' })
export class OdataCount implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    const count = await dataSet.count(this.injector)
    this.response.setHeader('content-type', 'application/json')
    this.response.setHeader('odata.metadata', 'none')

    this.response.end(count.toString() || '0')
  }
  constructor(
    private response: ServerResponse,
    private context: OdataContext<any>,
    private repo: Repository,
    private injector: Injector,
  ) {}
}

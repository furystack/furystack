import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
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
    const result = await dataSet.filter(this.injector, {})
    this.response.end(JSON.stringify(result))
  }
  constructor(
    public repo: Repository,
    public context: OdataContext<any>,
    private injector: Injector,
    public incomingMessage: IncomingMessage,
    public response: ServerResponse,
  ) {}
}

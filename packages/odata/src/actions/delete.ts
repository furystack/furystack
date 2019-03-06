import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { ServerResponse } from 'http'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class DeleteAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    await dataSet.remove(this.injector, this.context.entityId)
    this.response.writeHead(204, 'No Content')
    this.response.end()
  }
  constructor(
    private injector: Injector,
    public repo: Repository,
    private context: OdataContext<any>,
    public response: ServerResponse,
  ) {}
}

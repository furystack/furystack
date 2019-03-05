import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { ModelBuilder } from '../model-builder'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class GetEntityAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    const entity = await dataSet.get(this.injector, this.context.entityId)
    this.response.setHeader('content-type', 'application/json')
    this.response.end(
      JSON.stringify({
        '@odata.context': 'ToDo',
        ...entity,
      }),
    )
  }
  constructor(
    public model: ModelBuilder,
    public incomingMessage: IncomingMessage,
    public response: ServerResponse,
    public context: OdataContext<any>,
    public repo: Repository,
    private injector: Injector,
  ) {}
}

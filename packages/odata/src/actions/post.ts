import { IRequestAction, Utils } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class PostAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)

    const postBody = await this.utils.readPostBody(this.incomingMessage)

    const entity = await dataSet.add(this.injector, postBody)

    const expanded = await createEntityResponse({
      entity,
      entityType: this.context.entity,
      odataParams: this.context.queryParams,
      injector: this.injector,
      repo: this.repo,
    })

    this.response.writeHead(201, 'Created', { 'content-type': 'application/json', 'odata.metadata': 'minimal' })
    this.response.end(
      JSON.stringify({
        ...expanded,
      }),
    )
  }
  constructor(
    private incomingMessage: IncomingMessage,
    private response: ServerResponse,
    private context: OdataContext<any>,
    private repo: Repository,
    private injector: Injector,
    private utils: Utils,
  ) {}
}

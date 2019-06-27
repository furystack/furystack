import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'

/**
 * OData Post action
 */
@Injectable({ lifetime: 'transient' })
export class PostAction implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)

    const postBody = await this.incomingMessage.readPostBody()

    const entity = await dataSet.add(this.injector, postBody)

    const expanded = await createEntityResponse({
      entity,
      entityTypes: this.context.entities,
      entityType: this.context.entity,
      odataParams: this.context.queryParams,
      injector: this.injector,
      repo: this.repo,
      odataContext: this.context,
    })

    this.response.sendJson({
      statusCode: 201,
      json: {
        ...expanded,
      },
      headers: {
        'odata.metadata': 'minimal',
      },
    })
  }
  constructor(
    private incomingMessage: IncomingMessage,
    private response: ServerResponse,
    private context: OdataContext<any>,
    private repo: Repository,
    private injector: Injector,
  ) {}
}

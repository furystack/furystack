import { IRequestAction, Utils } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
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
    this.response.writeHead(201, 'Created', { 'content-type': 'application/json' })
    this.response.end(
      JSON.stringify({
        ...entity,
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

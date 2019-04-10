import { IRequestAction, Utils } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class PatchAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    const postBody = await this.utils.readPostBody(this.incomingMessage)

    await dataSet.update(this.injector, this.context.entityId, postBody)
    this.response.writeHead(204, 'No content', {
      'content-type': 'application/json',
    })
    this.response.end()
  }
  constructor(
    private repo: Repository,
    private context: OdataContext<any>,
    private response: ServerResponse,
    private injector: Injector,
    private utils: Utils,
    private incomingMessage: IncomingMessage,
  ) {}
}

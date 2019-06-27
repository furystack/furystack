import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { OdataContext } from '../odata-context'

/**
 * OData Patch action
 */
@Injectable({ lifetime: 'transient' })
export class PatchAction implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    const postBody = await this.incomingMessage.readPostBody()

    await dataSet.update(this.injector, this.context.entityId, postBody)
    this.response.writeHead(204, 'No content', {
      'content-type': 'application/json',
      'odata.metadata': 'none',
    })
    this.response.end()
  }
  constructor(
    private repo: Repository,
    private context: OdataContext<any>,
    private response: ServerResponse,
    private injector: Injector,
    private incomingMessage: IncomingMessage,
  ) {}
}

import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { expand } from '../expand'
import { getOdataParams } from '../getOdataParams'
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
    const params = getOdataParams(this.request)
    const dataSet = this.repo.getDataSetFor(this.context.collection.name)
    const plainValue = await dataSet.filter(this.injector, {
      order: [],
      skip: params.skip,
      top: params.top,
      select: params.select,
    })
    const count = await dataSet.count(this.injector)
    const value = await Promise.all(
      plainValue.map(
        async entity =>
          await expand({
            entity,
            entityType: this.context.entity,
            fieldNames: params.expand,
            injector: this.injector,
            repo: this.repo,
          }),
      ),
    )

    this.response.setHeader('content-type', 'application/json')
    this.response.end(
      JSON.stringify({
        '@odata.context': this.context.context,
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
    private request: IncomingMessage,
  ) {}
}

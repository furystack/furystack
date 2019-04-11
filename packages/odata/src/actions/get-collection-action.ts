import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { ServerResponse } from 'http'
import { expand } from '../expand'
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
    const plainValue = await dataSet.filter(this.injector, {
      order: this.context.queryParams.orderBy as any,
      skip: this.context.queryParams.skip,
      top: this.context.queryParams.top,
      select: this.context.queryParams.select,
    })
    const count = await dataSet.count(this.injector)
    const value = await Promise.all(
      plainValue.map(
        async entity =>
          await expand({
            entity,
            entityType: this.context.entity,
            fieldNames: this.context.queryParams.expand,
            injector: this.injector,
            repo: this.repo,
          }),
      ),
    )

    this.response.setHeader('content-type', 'application/json')
    this.response.setHeader('odata.metadata', 'minimal')
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
  ) {}
}

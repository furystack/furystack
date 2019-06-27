import { ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { OdataContext } from '../odata-context'

/**
 * OData Get Collection action
 */
@Injectable({ lifetime: 'transient' })
export class GetCollectionAction implements RequestAction {
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
      filter: this.context.queryParams.filter,
    })
    const count = await dataSet.count(this.injector)
    const value = await Promise.all(
      plainValue.map(
        async entity =>
          await createEntityResponse({
            entity,
            entityTypes: this.context.entities,
            entityType: this.context.entity,
            odataParams: this.context.queryParams,
            injector: this.injector,
            repo: this.repo,
            odataContext: this.context,
          }),
      ),
    )

    this.response.sendJson({
      json: {
        '@odata.context': this.context.context,
        '@odata.count': count,
        // '@odata.nextLink': 'ToDo',
        value,
      },
      headers: {
        'odata.metadata': 'minimal',
      },
    })
  }
  constructor(
    private repo: Repository,
    private context: OdataContext<any>,
    private injector: Injector,
    private response: ServerResponse,
  ) {}
}

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
export class GetEntityAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    const dataSet = this.repo.getDataSetFor<any>(this.context.collection.name)
    const entity = await dataSet.get(this.injector, this.context.entityId)
    this.response.setHeader('content-type', 'application/json')
    this.response.setHeader('odata.metadata', 'minimal')

    if (!entity) {
      this.response.writeHead(404, 'Not found')
      this.response.end(
        JSON.stringify({
          error: {
            code: '',
            message: `Resource not found for the segment '${this.context.collection.name}'.`,
          },
        }),
      )
      return
    }

    const expandedEntity = await expand({
      entity,
      entityType: this.context.entity,
      fieldNames: this.context.queryParams.expand,
      injector: this.injector,
      repo: this.repo,
    })

    this.response.end(
      JSON.stringify({
        '@odata.context': this.context.context,
        ...expandedEntity,
      }),
    )
  }
  constructor(
    private response: ServerResponse,
    private context: OdataContext<any>,
    private repo: Repository,
    private injector: Injector,
  ) {}
}

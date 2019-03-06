import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { ServerResponse } from 'http'
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

    this.response.end(
      JSON.stringify({
        '@odata.context': this.context.context,
        ...entity,
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

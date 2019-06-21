import { IncomingMessage, ServerResponse } from 'http'
import { RequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { createEntityResponse } from '../create-entity-response'
import { getOdataParams } from '../getOdataParams'
import { OdataContext } from '../odata-context'

/**
 * Odata Navigation Property Collection action
 */
@Injectable({ lifetime: 'transient' })
export class NavigationPropertyCollectionAction implements RequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    if (!this.context.navigationPropertyCollection) {
      throw Error(`No navigation property`)
    }

    const navProp = this.context.navigationPropertyCollection

    const dataSet = this.repo.getDataSetFor(navProp.dataSet)
    const relatedEntityType = this.context.entities.find(e => e.model === navProp.relatedModel)

    const baseDataSet = this.repo.getDataSetFor(this.context.collection.name)
    const baseEntity = await baseDataSet.get(this.injector, this.context.entityId as never)

    if (!baseEntity) {
      this.response.writeHead(404, 'not found')
      this.response.end()
      return
    }

    if (!relatedEntityType) {
      throw Error('No related entity found for navigation property')
    }

    const filter = this.request.url && relatedEntityType ? getOdataParams(this.request.url, relatedEntityType) : {}

    const plainValue = await navProp.getRelatedEntities(baseEntity, dataSet, this.injector, filter)
    const value = await Promise.all(
      plainValue.map(
        async entity =>
          await createEntityResponse({
            entity,
            entityTypes: this.context.entities,
            entityType: relatedEntityType || this.context.entity,
            odataParams: filter as any,
            injector: this.injector,
            repo: this.repo,
            odataContext: this.context,
          }),
      ),
    )

    this.response.setHeader('content-type', 'application/json')
    this.response.setHeader('odata.metadata', 'minimal')
    this.response.end(
      JSON.stringify({
        '@odata.context': this.context.context,
        ...(value instanceof Array ? { '@odata.count': value.length, value } : value),
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

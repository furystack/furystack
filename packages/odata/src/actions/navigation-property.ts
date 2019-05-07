import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { createEntityResponse } from '../create-entity-response'
import { getOdataParams } from '../getOdataParams'
import { OdataContext } from '../odata-context'

/**
 * OData Navigation Property action
 */
@Injectable({ lifetime: 'transient' })
export class NavigationPropertyAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async exec() {
    if (!this.context.navigationProperty) {
      throw Error(`No navigation property`)
    }
    const navProp = this.context.navigationProperty
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

    const plainValue = await navProp.getRelatedEntity(baseEntity, dataSet, this.injector, filter)
    const value = await createEntityResponse({
      entity: plainValue,
      entityTypes: this.context.entities,
      entityType: relatedEntityType || this.context.entity,
      odataParams: filter as any,
      injector: this.injector,
      repo: this.repo,
      odataContext: this.context,
    })

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

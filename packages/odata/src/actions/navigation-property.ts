import { IRequestAction } from '@furystack/http-api'
import { Injectable, Injector } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import { IncomingMessage, ServerResponse } from 'http'
import { createEntityResponse } from '../create-entity-response'
import { getOdataParams } from '../getOdataParams'
import { NavigationProperty, NavigationPropertyCollection } from '../models'
import { OdataContext } from '../odata-context'

/**
 * Root action for OData endpoints
 */
@Injectable({ lifetime: 'transient' })
export class NavigationPropertyAction implements IRequestAction {
  public dispose() {
    /** */
  }

  public async execNavigationProperty(navigationProperty: NavigationProperty<any, any>) {
    const dataSet = this.repo.getDataSetFor(navigationProperty.dataSet)
    const relatedEntityType = this.context.entities.find(e => e.model === navigationProperty.relatedModel)

    if (!relatedEntityType) {
      throw Error('No related entity found for navigation property')
    }

    const baseDataSet = this.repo.getDataSetFor(this.context.collection.name)
    const baseEntity = await baseDataSet.get(this.injector, this.context.entityId as never)

    if (!baseEntity) {
      this.response.writeHead(404, 'not found')
      this.response.end()
      return
    }

    const filter = this.request.url && relatedEntityType ? getOdataParams(this.request.url, relatedEntityType) : {}

    const plainValue = await navigationProperty.getRelatedEntity(baseEntity, dataSet, this.injector, filter)

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

  public async execNavigationPropertyCollection(navigationPropertyCollection: NavigationPropertyCollection<any, any>) {
    const dataSet = this.repo.getDataSetFor(navigationPropertyCollection.dataSet)
    const relatedEntityType = this.context.entities.find(e => e.model === navigationPropertyCollection.relatedModel)

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

    const plainValue = await navigationPropertyCollection.getRelatedEntities(baseEntity, dataSet, this.injector, filter)
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

  public async exec() {
    if (this.context.navigationProperty) {
      return await this.execNavigationProperty(this.context.navigationProperty)
    } else if (this.context.navigationPropertyCollection) {
      return await this.execNavigationPropertyCollection(this.context.navigationPropertyCollection)
    }
    throw Error(`No navigation properties`)
  }
  constructor(
    private repo: Repository,
    private context: OdataContext<any>,
    private injector: Injector,
    private response: ServerResponse,
    private request: IncomingMessage,
  ) {}
}

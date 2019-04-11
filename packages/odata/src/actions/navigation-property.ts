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

  public async exec() {
    if (!this.context.navigationProperty) {
      throw Error(`No navigation property`)
    }
    const dataSet = this.repo.getDataSetFor(this.context.navigationProperty.dataSet)
    const relatedEntity = this.context.entities.find(
      e => e.model === (this.context.navigationProperty as NavigationProperty<any>).relatedModel,
    )

    const filter = this.request.url && relatedEntity ? getOdataParams(this.request.url, relatedEntity) : {}

    const plainValue = await (((this.context.navigationProperty as NavigationProperty<{}>).getRelatedEntity &&
      (this.context.navigationProperty as NavigationProperty<{}>).getRelatedEntity(
        this.context.entity,
        dataSet,
        this.injector,
        filter,
      )) ||
      (this.context.navigationProperty as NavigationPropertyCollection<{}>).getRelatedEntities(
        this.context.entity,
        dataSet,
        this.injector,
        filter,
      ))
    const value =
      plainValue instanceof Array
        ? await Promise.all(
            plainValue.map(
              async entity =>
                await createEntityResponse({
                  entity,
                  entityTypes: this.context.entities,
                  entityType: this.context.entity,
                  odataParams: filter as any,
                  injector: this.injector,
                  repo: this.repo,
                }),
            ),
          )
        : await createEntityResponse({
            entity: plainValue,
            entityTypes: this.context.entities,
            entityType: this.context.entity,
            odataParams: filter as any,
            injector: this.injector,
            repo: this.repo,
          })

    this.response.setHeader('content-type', 'application/json')
    this.response.setHeader('odata.metadata', 'minimal')
    this.response.end(
      JSON.stringify({
        '@odata.context': this.context.context,
        ...(value instanceof Array ? { value } : value),
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

import { HttpApiSettings } from '@furystack/http-api'
import { Injector } from '@furystack/inject'
import { DataSet } from '@furystack/repository'
import { ModelBuilder } from './model-builder'
import { createOdataRouter } from './routing'
import { OdataContext } from './odata-context'

declare module '@furystack/inject/dist/injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    /**
     * registers an OData endpoint to the injector.
     * Usage example:
     * ````ts
     * myInjector
     *  .useOdata('odata', builder =>
     *    builder.addNamespace('myNamespace', namespaceBuilder => ... ))
     * ````
     *
     */
    useOdata: (route: string, buildModel: (builder: ModelBuilder) => ModelBuilder) => this
    getOdataContext: <T>() => OdataContext<T> & {
      getCurrentDataSet: () => DataSet<T>
      getCurrentEntity: () => Promise<T | undefined>
    }
  }
}

Injector.prototype.useOdata = function(route, buildModel) {
  const instance = buildModel(new ModelBuilder())
  this.setExplicitInstance(instance)

  const entities = Array.from(instance.namespaces.values())
    .map(ns => ns.entities.entities.values())
    .map(e => Array.from(e))
    .flat()

  const collections = Array.from(instance.namespaces.values())
    .map(ns => ns.collections.collections.values())
    .map(c => Array.from(c))
    .flat()

  const globalActions = [...Array.from(instance.namespaces.values()).map(ns => ns.actions)].flat()

  const globalFunctions = [...Array.from(instance.namespaces.values()).map(ns => ns.functions)].flat()

  this.getInstance(HttpApiSettings).actions.push(
    createOdataRouter({
      route,
      entities,
      collections,
      globalActions,
      globalFunctions,
    }),
  )
  return this
}

Injector.prototype.getOdataContext = function<T>() {
  const context = this.getInstance(OdataContext) as OdataContext<T>
  return {
    ...context,
    getCurrentDataSet: () => this.getDataSetFor<T>(context.collection.name) as DataSet<T>,
    getCurrentEntity: () => this.getDataSetFor<T>(context.collection.name).get(this, context.entityId as any),
  }
}

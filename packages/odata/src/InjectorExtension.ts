import { HttpApiSettings } from '@furystack/http-api'
import { Injector } from '@furystack/inject/dist/Injector'
import { ModelBuilder } from './model-builder'
import { createOdataRouter } from './routing'

declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useOdata: (route: string, buildModel: (builder: ModelBuilder) => ModelBuilder) => this
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

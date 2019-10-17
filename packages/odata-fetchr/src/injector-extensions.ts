import { Injector, Constructable } from '@furystack/inject'
import { ODataServiceOptions, OdataService } from './odata-service'

declare module '@furystack/inject/dist/Injector' {
  interface Injector {
    useOdata: (params: Omit<Omit<ODataServiceOptions, 'model'>, 'modelName'>) => Injector
    getOdataServiceFor: <T>(model: Constructable<T>, modelName: string) => OdataService<T>
  }
}

Injector.prototype.useOdata = function(params) {
  this.setExplicitInstance({ ...params, model: Object.constructor }, ODataServiceOptions)
  this.getOdataServiceFor = function(model, modelName) {
    return new OdataService({ ...this.getInstance(ODataServiceOptions), model, modelName })
  }
  return this
}

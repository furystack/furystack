import { Injector } from './injector.js'
import type { Constructable } from './models/constructable.js'

export const Injected: <T extends Constructable<unknown>>(ctor: T) => PropertyDecorator =
  (ctor) => (target, propertyKey) => {
    const targetCtor = target.constructor as Constructable<any>
    if (!Injector.injectableFields.has(targetCtor)) {
      Injector.injectableFields.set(targetCtor, {})
    }
    const meta = Injector.injectableFields.get(targetCtor)
    Injector.injectableFields.set(targetCtor, {
      ...meta,
      [propertyKey]: ctor,
    })
  }

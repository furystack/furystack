import { Injector } from './injector.js'

export type WithInjectorReference = { injector: Injector }

export const hasInjectorReference = <T>(instance: T): instance is T & WithInjectorReference => {
  return instance && typeof instance === 'object' && 'injector' in instance && instance.injector instanceof Injector
}

export const withInjectorReference = <T>(instance: T, injector: Injector) => {
  Object.assign(instance as object, { injector })
  return instance as T & WithInjectorReference
}

export const getInjectorReference = <T>(instance: T): Injector => {
  if (!hasInjectorReference(instance)) {
    throw new Error('The instance does not have an injector reference')
  }
  return instance.injector
}

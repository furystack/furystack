import { getInjectorReference } from './with-injector-reference.js'
import type { Constructable } from './models/constructable.js'

export const InjectableDependencyList = Symbol('InjectableDependencyList')

export const getDependencyList = <T extends Constructable<unknown>>(ctor: T): Set<Constructable<any>> => {
  const existing = (ctor as any)[InjectableDependencyList] as Set<Constructable<any>>
  if (existing && existing instanceof Set) {
    return existing
  }
  const newSet = new Set<Constructable<any>>()
  Object.assign(ctor, { [InjectableDependencyList]: newSet })
  return newSet
}

const addDependency = <T extends Constructable<unknown>>(ctor: T, dependency: Constructable<any>) => {
  const list = getDependencyList(ctor)
  list.add(dependency)
}

export const Injected: <T extends Constructable<unknown>>(injectable: T) => PropertyDecorator =
  (injectable) => (target, propertyKey) => {
    addDependency(target.constructor as Constructable<unknown>, injectable)

    Object.defineProperty(target.constructor.prototype, propertyKey, {
      set() {
        throw new Error('Injected properties are read-only')
      },
      get() {
        return getInjectorReference(this).getInstance(injectable)
      },
    })
  }

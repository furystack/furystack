import { hasInjectableOptions } from './injectable.js'
import type { Injector } from './injector.js'
import type { Constructable } from './models/constructable.js'
import { getInjectorReference } from './with-injector-reference.js'

export const InjectableDependencyList = Symbol('InjectableDependencyList')

export const getDependencyList = <T extends Constructable<unknown>>(ctor: T): Set<Constructable<unknown>> => {
  const existing = (ctor as T & { [InjectableDependencyList]: Set<Constructable<any>> })[InjectableDependencyList]
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

export const Injected: <T>(injectable: Constructable<unknown> | ((injector: Injector) => T)) => PropertyDecorator =
  (injectable) => (target, propertyKey) => {
    const hasMeta = hasInjectableOptions(injectable as Constructable<unknown>)
    // The provided injectable is a constructor
    if (hasMeta) {
      addDependency(target.constructor as Constructable<unknown>, injectable as Constructable<unknown>)
      Object.defineProperty(target.constructor.prototype, propertyKey, {
        set() {
          throw new Error(`Injected property '${target.constructor.name}.${propertyKey.toString()}' is read-only`)
        },
        get() {
          return getInjectorReference(this).getInstance(injectable as Constructable<unknown>)
        },
      })
    } else {
      // The provided injectable is a getter function
      Object.defineProperty(target.constructor.prototype, propertyKey, {
        set() {
          throw new Error(`Injected property '${target.constructor.name}.${propertyKey.toString()}' is read-only`)
        },
        get() {
          return (injectable as (injector: Injector) => unknown).call(this, getInjectorReference(this))
        },
      })
    }
  }

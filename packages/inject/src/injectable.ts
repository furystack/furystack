import type { Constructable } from './models/constructable.js'

/**
 * Options for the injectable instance
 */
export interface InjectableOptions {
  /**
   * `transient` - A new instance will be created always when the user requests an instance from the injector. The instance will not be stored in the injector cache.
   * `singleton` - A new instance will be created only when an instance is not available in the injector or one of its parents. The owner injector will be the topmost parent in the injector chain
   * `scoped` - Similar to transient, but the instance will be stored in the injector cache of the same injector as it's requested from. The scope wil be available to it's children.
   * `explicit` - An instance can be only requested if the injector instance or one of it's parent has it cached (e.g. by a `use***()` helper)
   */
  lifetime: 'transient' | 'singleton' | 'scoped' | 'explicit'
}

/**
 * The default options for the injectable classes
 */
export const defaultInjectableOptions: InjectableOptions = {
  lifetime: 'transient',
}

export const InjectableOptionsSymbol = Symbol('InjectableOptions')

type WithInjectableOptions<T> = T & { [InjectableOptionsSymbol]: InjectableOptions }

/**
 * Checks if the constructor is decorated with Injectable() with verifying if it has Injectable options
 * @param ctor The constructor to check
 * @returns if the constructor has the InjectableOptionsSymbol
 */
export const hasInjectableOptions = <T extends Constructable<any>>(ctor: T): ctor is WithInjectableOptions<T> => {
  return (
    typeof (ctor as WithInjectableOptions<T>)[InjectableOptionsSymbol] === 'object' &&
    typeof (ctor as WithInjectableOptions<T>)[InjectableOptionsSymbol].lifetime === 'string'
  )
}

/**
 * @throws Error if the class is not an injectable
 * @param ctor The constructor to get the options from
 * @returns The InjectableOptions object
 */
export const getInjectableOptions = <T extends Constructable<any>>(ctor: T): InjectableOptions => {
  if (!hasInjectableOptions(ctor)) {
    throw Error(`The class '${ctor.name}' is not an injectable`)
  }
  return ctor[InjectableOptionsSymbol]
}

/**
 * Decorator method for tagging a class as injectable
 * @param options The options object
 * @returns void
 */
export const Injectable = (options?: Partial<InjectableOptions>) => {
  return <T extends Constructable<any>>(ctor: T) => {
    Object.assign(ctor, {
      [InjectableOptionsSymbol]: {
        ...defaultInjectableOptions,
        ...options,
      },
    })
  }
}

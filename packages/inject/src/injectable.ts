import type { Constructable } from './models/constructable.js'

/**
 * Options for the injectable instance
 */
export interface InjectableOptions {
  lifetime: 'transient' | 'singleton' | 'scoped'
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
    typeof (ctor as any)[InjectableOptionsSymbol] === 'object' &&
    typeof ((ctor as any)[InjectableOptionsSymbol] as InjectableOptions).lifetime === 'string'
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

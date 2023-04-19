import { Injector } from './injector'
import type { Constructable } from './models/constructable'

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

/**
 * Decorator method for tagging a class as injectable
 * @param options The options object
 * @returns void
 */
export const Injectable = (options?: Partial<InjectableOptions>) => {
  return <T extends Constructable<any>>(ctor: T) => {
    Injector.options.set(ctor, {
      ...defaultInjectableOptions,
      ...options,
    })
  }
}

import 'reflect-metadata'
import { Injector } from './Injector'
import { Constructable } from './Types/Constructable'

/**
 * Options for the injectable instance
 */
export interface IInjectableOptions {
  /**
   * Enables or disables resolving the dependencies from the constructor (true by default)
   */
  ResolveDependencies: boolean
}

/**
 * The default options for the injectable classes
 */
export const defaultInjectableOptions: IInjectableOptions = {
  ResolveDependencies: true,
}

/**
 * Decorator method for tagging a class as injectable
 * @param options The options object
 */
export const Injectable = (options?: Partial<IInjectableOptions>) => {
  return <T extends Constructable<any>>(ctor: T) => {
    const meta = Reflect.getMetadata('design:paramtypes', ctor)
    const metaValue = {
      Dependencies:
        (meta &&
          (meta as any[]).map(param => {
            return param
          })) ||
        [],
      Options: { ...defaultInjectableOptions, ...options },
    }
    Injector.Default.meta.set(ctor, metaValue)
  }
}

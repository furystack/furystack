import { Disposable } from '@sensenet/client-utils'
import { Constructable } from './Types/Constructable'

/**
 * Container for injectable instances
 */
export class Injector implements Disposable {
  /**
   * Disposes the Injector object and all its disposable injectables
   */
  public async dispose() {
    /** */
    const singletons = Array.from(this.cachedSingletons.entries()).map(e => e[1])
    const disposeRequests = singletons
      .filter(s => s !== this)
      .map(async s => {
        if (s.dispose) {
          await s.dispose()
        }
      })
    await Promise.all(disposeRequests)
  }

  /**
   * Options object for an injetros instance
   */
  public options: { parent?: Injector; owner?: any } = {}

  /**
   * Static class metadata map, filled by the @Injectable() decorator
   */
  public static meta: Map<
    Constructable<any>,
    {
      Dependencies: Array<Constructable<any>>
      Options: import('./Injectable').IInjectableOptions
    }
  > = new Map()

  private cachedSingletons: Map<Constructable<any>, any> = new Map()

  public remove = <T>(ctor: Constructable<T>) => this.cachedSingletons.delete(ctor)

  /**
   *
   * @param ctor The constructor object (e.g. IncomingMessage)
   * @param local Flag that forbids parent walk if the instance is not available but the injector has a parent
   * @param dependencies Resolved dependencies
   */
  public getInstance<T>(ctor: Constructable<T>, local: boolean = false, dependencies: Array<Constructable<T>> = []): T {
    if (ctor === this.constructor) {
      return (this as any) as T
    }
    if (dependencies.includes(ctor)) {
      throw Error(`Circular dependencies found.`)
    }
    if (this.cachedSingletons.has(ctor)) {
      return this.cachedSingletons.get(ctor) as T
    }
    const fromParent = !local && this.options.parent && this.options.parent.getInstance(ctor)
    if (fromParent) {
      return fromParent
    }
    const meta = Injector.meta.get(ctor)
    if (!meta) {
      throw Error(
        `No metadata found for '${ctor.name}'. Dependencies: ${dependencies
          .map(d => d.name)
          .join(',')} Be sure that it's decorated with '@Injectable()' or added explicitly with SetInstance()`,
      )
    }
    const deps = meta.Options.ResolveDependencies
      ? meta.Dependencies.map(dep => this.getInstance(dep, false, [...dependencies, ctor]))
      : []
    const newInstance = new ctor(...deps)
    this.setExplicitInstance(newInstance)
    return newInstance
  }

  /**
   * Sets explicitliy an instance for a key in the store
   * @param instance The created instance
   * @param key The class key to be persisted (optional, calls back to the instance's constructor)
   */
  public setExplicitInstance<T>(instance: T, key?: Constructable<any>) {
    if (instance.constructor === this.constructor) {
      throw Error('Cannot set an injector instance as injectable')
    }
    this.cachedSingletons.set(key || (instance.constructor as Constructable<T>), instance)
  }

  /**
   * Retrieves an instance and runs it's `setup()` method if available
   * @param ctor The constructor of the resource
   * @param args Arguments for the instance's setup() method
   */
  public setupInstance<T extends { setup: (...args: TSetupArgs) => void }, TSetupArgs extends any[]>(
    ctor: new (...args: any[]) => T,
    ...args: TSetupArgs
  ) {
    const instance = this.getInstance(ctor)
    instance.setup && instance.setup(...args)
    this.setExplicitInstance(instance)
    return instance
  }

  /**
   * Retrieves an instance and runs it's `setup()` method if available
   * @param ctor The constructor of the resource
   * @param args Arguments for the instance's setup() method
   */
  public setupLocalInstance<T extends { setup: (...args: TSetupArgs) => void }, TSetupArgs extends any[]>(
    ctor: new (...args: any[]) => T,
    ...args: TSetupArgs
  ) {
    const instance = this.getInstance(ctor, true)
    instance.setup && instance.setup(...args)
    this.setExplicitInstance(instance)
    return instance
  }

  public createChild(options?: Partial<Injector['options']>) {
    const i = new Injector()
    i.options = i.options || options
    i.options.parent = this
    return i
  }
}

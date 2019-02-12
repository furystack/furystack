import { Disposable } from '@sensenet/client-utils'
import { Constructable } from './Types/Constructable'

/**
 * Container for injectable instances
 */
export class Injector implements Disposable {
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

  public options: { parent: Injector; owner: any } = {
    parent: Injector.Default,
    owner: null,
  }

  // tslint:disable-next-line: variable-name
  public static Default: Injector = new Injector({ parent: undefined })
  public meta: Map<
    Constructable<any>,
    {
      Dependencies: Array<Constructable<any>>
      Options: import('./Injectable').IInjectableOptions
    }
  > = new Map()

  private cachedSingletons: Map<Constructable<any>, any> = new Map()

  // tslint:disable-next-line: variable-name
  public Remove = <T>(ctor: Constructable<T>) => this.cachedSingletons.delete(ctor)

  public GetInstance<T>(ctor: Constructable<T>, local: boolean = false, dependencies: Array<Constructable<T>> = []): T {
    if (ctor === this.constructor) {
      return (this as any) as T
    }
    if (dependencies.includes(ctor)) {
      throw Error(`Circular dependencies found.`)
    }
    if (this.cachedSingletons.has(ctor)) {
      return this.cachedSingletons.get(ctor) as T
    }
    const fromParent = !local && this.options.parent && this.options.parent.GetInstance(ctor)
    if (fromParent) {
      return fromParent
    }
    const meta = Injector.Default.meta.get(ctor)
    if (!meta) {
      throw Error(
        `No metadata found for '${ctor.name}'. Dependencies: ${dependencies
          .map(d => d.name)
          .join(',')} Be sure that it's decorated with '@Injectable()' or added explicitly with SetInstance()`,
      )
    }
    const deps = meta.Options.ResolveDependencies
      ? meta.Dependencies.map(dep => this.GetInstance(dep, false, [...dependencies, ctor]))
      : []
    const newInstance = new ctor(...deps)
    this.SetInstance(newInstance)
    return newInstance
  }

  public SetInstance<T>(instance: T, key?: Constructable<any>) {
    if (instance.constructor === this.constructor) {
      throw Error('Cannot set an injector instance as injectable')
    }
    this.cachedSingletons.set(key || (instance.constructor as Constructable<T>), instance)
  }

  constructor(options?: Partial<Injector['options']>) {
    this.options = { ...this.options, ...options }
  }
}

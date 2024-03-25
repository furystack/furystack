import type { Disposable } from '@furystack/utils'
import { getInjectableOptions } from './injectable.js'
import type { Constructable } from './models/constructable.js'

const hasInitMethod = (obj: Object): obj is { init: (injector: Injector) => void } => {
  return typeof (obj as any).init === 'function'
}

export class InjectorAlreadyDisposedError extends Error {
  constructor() {
    super('Injector already disposed')
  }
}

export class Injector implements Disposable {
  private isDisposed = false

  /**
   * Disposes the Injector object and all its disposable injectables
   */
  public async dispose() {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    this.isDisposed = true

    const singletons = Array.from(this.cachedSingletons.entries()).map((e) => e[1])
    const disposeRequests = singletons
      .filter((s) => s !== this)
      .map(async (s) => {
        if (s.dispose) {
          await s.dispose()
        }
      })
    const result = await Promise.allSettled(disposeRequests)
    const fails = result.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    if (fails && fails.length) {
      throw new Error(
        `There was an error during disposing '${fails.length}' global disposable objects: ${fails.map(
          (f) => f.reason,
        )}`,
      )
    }

    this.cachedSingletons.clear()
  }

  /**
   * Options object for an injector instance
   */
  public options: { parent?: Injector; owner?: any } = {}

  public static injectableFields: Map<Constructable<any>, { [K: string]: Constructable<any> }> = new Map()

  public readonly cachedSingletons: Map<Constructable<any>, any> = new Map()

  public remove = <T>(ctor: Constructable<T>) => {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    this.cachedSingletons.delete(ctor)
  }

  /**
   *
   * @param ctor The constructor object (e.g. MyClass)
   * @param dependencies Resolved dependencies (usually provided by the framework)
   * @returns The instance of the requested service
   */
  public getInstance<T>(ctor: Constructable<T>, dependencies: Array<Constructable<T>> = []): T {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    if (ctor === this.constructor) {
      return this as any as T
    }

    if (this.cachedSingletons.has(ctor)) {
      return this.cachedSingletons.get(ctor)
    }

    const meta = getInjectableOptions(ctor)
    if (dependencies.includes(ctor)) {
      throw Error(`Circular dependencies found.`)
    }

    const { lifetime = 'singleton' } = meta

    const injectedFields = Object.entries(Injector.injectableFields.get(ctor) || {})

    if (lifetime === 'singleton') {
      const invalidDeps = [...injectedFields]
        .map(([, dep]) => ({ meta: getInjectableOptions(dep), dep }))
        .filter((m) => m.meta && (m.meta.lifetime === 'scoped' || m.meta.lifetime === 'transient'))
        .map((i) => i.meta && `${i.dep.name}:${i.meta.lifetime}`)
      if (invalidDeps.length) {
        throw Error(
          `Injector error: Singleton type '${ctor.name}' depends on non-singleton injectables: ${invalidDeps.join(
            ',',
          )}`,
        )
      }
    } else if (lifetime === 'scoped') {
      const invalidDeps = [...injectedFields.values()]
        .map(([, dep]) => ({ meta: getInjectableOptions(dep), dep }))
        .filter((m) => m.meta && m.meta.lifetime === 'transient')
        .map((i) => i.meta && `${i.dep.name}:${i.meta.lifetime}`)
      if (invalidDeps.length) {
        throw Error(
          `Injector error: Scoped type '${ctor.name}' depends on transient injectables: ${invalidDeps.join(',')}`,
        )
      }
    }

    const fromParent = lifetime === 'singleton' && this.options.parent && this.options.parent.getInstance(ctor)
    if (fromParent) {
      return fromParent
    }
    const deps = injectedFields.map(([key, dep]) => [key, this.getInstance(dep, [...dependencies, ctor])])
    const newInstance = new ctor()
    deps.forEach(([key, value]) => {
      newInstance[key as keyof T] = value
    })
    if (lifetime !== 'transient') {
      this.setExplicitInstance(newInstance)
    }

    if (hasInitMethod(newInstance)) {
      newInstance.init(this)
    }
    return newInstance
  }

  /**
   * Sets explicitliy an instance for a key in the store
   * @param instance The created instance
   * @param key The class key to be persisted (optional, calls back to the instance's constructor)
   */
  public setExplicitInstance<T extends object>(instance: T, key?: Constructable<any>) {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    const ctor = key || (instance.constructor as Constructable<T>)

    if (instance.constructor === this.constructor) {
      throw Error('Cannot set an injector instance as injectable')
    }
    this.cachedSingletons.set(ctor, instance)
  }

  /**
   * Creates a child injector instance
   * @param options Additional injector options
   * @returns the created Injector
   */
  public createChild(options?: Partial<Injector['options']>) {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    const i = new Injector()
    i.options = i.options || options
    i.options.parent = this
    return i
  }
}

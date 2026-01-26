import { isAsyncDisposable, isDisposable } from '@furystack/utils'
import { Injectable, getInjectableOptions, type InjectorLifetime } from './injectable.js'
import { getDependencyList } from './injected.js'
import type { Constructable } from './models/constructable.js'
import { hasInjectorReference, withInjectorReference } from './with-injector-reference.js'

const hasInitMethod = (obj: object): obj is { init: (injector: Injector) => void } => {
  return typeof (obj as { init?: (injector: Injector) => void }).init === 'function'
}

export class InjectorAlreadyDisposedError extends Error {
  constructor() {
    super('Injector already disposed')
  }
}

const lifetimesToCache: InjectorLifetime[] = ['singleton', 'scoped', 'explicit']

export class CannotInstantiateExplicitLifetimeError extends Error {
  /**
   *
   */
  constructor(ctor: Constructable<unknown>) {
    super(
      `Cannot instantiate an instance of '${ctor.name}' as it's lifetime is set to 'explicit'. Ensure to initialize it properly`,
    )
  }
}

@Injectable({ lifetime: 'system' as 'singleton' })
export class Injector implements AsyncDisposable {
  private isDisposed = false

  /**
   * Disposes the Injector object and all its disposable injectables
   */
  public async [Symbol.asyncDispose]() {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    this.isDisposed = true

    const singletons = Array.from(this.cachedSingletons.entries()).map((e) => e[1])
    const disposeRequests = singletons
      .filter((s) => s !== this)
      .map(async (s) => {
        if (isDisposable(s)) {
          s[Symbol.dispose]()
        }
        if (isAsyncDisposable(s)) {
          await s[Symbol.asyncDispose]()
        }
      })
    const result = await Promise.allSettled(disposeRequests)
    const fails = result.filter((r) => r.status === 'rejected')
    if (fails && fails.length) {
      throw new Error(
        `There was an error during disposing '${fails.length}' global disposable objects: ${fails
          .map((f) => f.reason as string)
          .join(', ')}`,
      )
    }

    this.cachedSingletons.clear()
  }

  /**
   * Options object for an injector instance
   */
  public options: { parent?: Injector; owner?: unknown } = {}

  // public static injectableFields: Map<Constructable<any>, { [K: string]: Constructable<any> }> = new Map()

  public readonly cachedSingletons: Map<Constructable<unknown>, unknown> = new Map()

  public remove = <T>(ctor: Constructable<T>) => {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    this.cachedSingletons.delete(ctor)
  }

  public getInstance<T>(ctor: Constructable<T>): T {
    const instance = this.getInstanceInternal(ctor)
    if (!hasInjectorReference(instance)) {
      withInjectorReference(instance, this)
    }
    return instance
  }

  /**
   *
   * @param ctor The constructor object (e.g. MyClass)
   * @returns The instance of the requested service
   */
  private getInstanceInternal<T>(ctor: Constructable<T>): T {
    if (this.isDisposed) {
      throw new InjectorAlreadyDisposedError()
    }

    if (ctor === this.constructor) {
      return this as any as T
    }

    const existing = this.cachedSingletons.get(ctor)

    if (existing) {
      return existing as T
    }

    const meta = getInjectableOptions(ctor)

    const { lifetime } = meta

    const fromParent =
      (lifetime === 'singleton' || lifetime === 'explicit') &&
      this.options.parent &&
      this.options.parent.getInstanceInternal(ctor)
    if (fromParent) {
      return fromParent
    }

    if (lifetime === 'explicit') {
      throw new CannotInstantiateExplicitLifetimeError(ctor)
    }

    const dependencies = [...getDependencyList(ctor)]

    if (dependencies.includes(ctor)) {
      throw Error(`Circular dependencies found.`)
    }

    if (lifetime === 'singleton') {
      const invalidDeps = dependencies
        .map((dep) => ({ meta: getInjectableOptions(dep), dep }))
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
      const invalidDeps = dependencies
        .map((dep) => ({ meta: getInjectableOptions(dep), dep }))
        .filter((m) => m.meta && m.meta.lifetime === 'transient')
        .map((i) => i.meta && `${i.dep.name}:${i.meta.lifetime}`)
      if (invalidDeps.length) {
        throw Error(
          `Injector error: Scoped type '${ctor.name}' depends on transient injectables: ${invalidDeps.join(',')}`,
        )
      }
    }

    const newInstance = new ctor()
    withInjectorReference(newInstance, this)

    if (lifetimesToCache.includes(lifetime)) {
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

    const { lifetime } = getInjectableOptions(ctor)

    if (instance.constructor === this.constructor) {
      throw Error('Cannot set an injector instance as injectable')
    }

    if (!lifetimesToCache.includes(lifetime)) {
      throw new Error(`Cannot set an instance of '${ctor.name}' as it's lifetime is set to '${lifetime}'`)
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

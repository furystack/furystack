import type { Disposable } from '@furystack/utils'
import { ObservableValue, Trace } from '@furystack/utils'
import { Injectable, type Injector } from '@furystack/inject'
import {
  deserializeQueryString as defaultDeserializeQueryString,
  serializeToQueryString as defaultSerializeToQueryString,
} from '@furystack/rest'
@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  constructor(
    private readonly serializeToQueryString = defaultSerializeToQueryString,

    public readonly deserializeQueryString = defaultDeserializeQueryString,
  ) {
    window.addEventListener('popstate', this.popStateListener)
    window.addEventListener('hashchange', this.hashChangeListener)

    this.pushStateTracer = Trace.method({
      object: history,
      method: history.pushState,
      isAsync: false,
      onFinished: () => this.updateState(),
    })

    this.replaceStateTracer = Trace.method({
      object: history,
      method: history.replaceState,
      isAsync: false,
      onFinished: () => this.updateState(),
    })

    this.onDeserializedLocationSearchChanged = new ObservableValue(this.deserializeQueryString(location.search))
  }

  public dispose() {
    window.removeEventListener('popstate', this.popStateListener)
    window.removeEventListener('hashchange', this.hashChangeListener)
    this.pushStateTracer.dispose()
    this.replaceStateTracer.dispose()
    this.onLocationPathChanged.dispose()
    this.onLocationSearchChanged.dispose()
    this.onDeserializedLocationSearchChanged.dispose()
    this.locationDeserializerObserver.dispose()
  }

  /**
   * Observable value that will be updated when the location pathname (e.g. /page/1) changes
   */
  public onLocationPathChanged = new ObservableValue(new URL(location.href).pathname)

  /**
   * Observable value that will be updated when the location hash (e.g. #hash) changes
   */
  public onLocationHashChanged = new ObservableValue(location.hash)

  /**
   * Observable value that will be updated when the location search (e.g. ?search=1) changes
   */
  public onLocationSearchChanged = new ObservableValue<string>(location.search)

  public onDeserializedLocationSearchChanged: ObservableValue<any>

  public locationDeserializerObserver = this.onLocationSearchChanged.subscribe((search) => {
    this.onDeserializedLocationSearchChanged.setValue(this.deserializeQueryString(search))
  })

  public updateState = (() => {
    this.onLocationPathChanged.setValue(location.pathname)
    this.onLocationHashChanged.setValue(location.hash)
    this.onLocationSearchChanged.setValue(location.search)
  }).bind(this)

  public readonly searchParamObservables = new Map<string, ObservableValue<any>>()

  /**
   *
   * @param key The search param key (e.g. ?search=1 -> search)
   * @param defaultValue The default value if not provided
   * @returns An observable with the current value (or default value) of the search param
   */
  public useSearchParam<T>(key: string, defaultValue: T) {
    const existing = this.searchParamObservables.get(key)

    if (!existing) {
      const currentDeserialized = this.onDeserializedLocationSearchChanged.getValue()

      const actualValue = Object.prototype.hasOwnProperty.call(currentDeserialized, key)
        ? (currentDeserialized[key] as T)
        : defaultValue

      const newObservable = new ObservableValue(actualValue)
      this.searchParamObservables.set(key, newObservable)

      newObservable.subscribe((value) => {
        const currentQueryStringObject = this.onDeserializedLocationSearchChanged.getValue()
        if (currentQueryStringObject[key] !== value) {
          const params = this.serializeToQueryString({ ...currentQueryStringObject, [key]: value })
          const newUrl = `${location.pathname}?${params}`
          history.pushState({}, '', newUrl)
        }
      })

      this.onDeserializedLocationSearchChanged.subscribe((search) => {
        const value = (search[key] as T) ?? defaultValue
        this.searchParamObservables.get(key)?.setValue(value)
      })
      return newObservable
    }
    return existing as ObservableValue<T>
  }

  private pushStateTracer: Disposable
  private replaceStateTracer: Disposable

  private popStateListener = (_ev: PopStateEvent) => {
    this.updateState()
  }

  private hashChangeListener = (_ev: HashChangeEvent) => {
    this.updateState()
  }
}

export const useCustomSearchStateSerializer = (
  injector: Injector,
  serialize: typeof defaultSerializeToQueryString,
  deserialize: typeof defaultDeserializeQueryString,
) => {
  if (injector.cachedSingletons.has(LocationService)) {
    throw new Error('useCustomSearchStateSerializer must be called before the LocationService is instantiated')
  }

  const locationService = new LocationService(serialize, deserialize)
  injector.setExplicitInstance(locationService, LocationService)
}

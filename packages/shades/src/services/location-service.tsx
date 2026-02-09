import { Injectable, type Injector } from '@furystack/inject'
import {
  deserializeQueryString as defaultDeserializeQueryString,
  serializeToQueryString as defaultSerializeToQueryString,
} from '@furystack/rest'
import { ObservableValue } from '@furystack/utils'
/**
 * Singleton service that tracks browser location changes (pathname, search, hash)
 * and exposes them as observable values for reactive routing and URL-driven state.
 */
@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  constructor(
    private readonly serializeToQueryString = defaultSerializeToQueryString,

    public readonly deserializeQueryString = defaultDeserializeQueryString,
  ) {
    window.addEventListener('popstate', this.popStateListener)
    window.addEventListener('hashchange', this.hashChangeListener)

    this.onDeserializedLocationSearchChanged = new ObservableValue(this.deserializeQueryString(location.search))

    this.originalPushState = window.history.pushState.bind(window.history)
    window.history.pushState = ((...args: Parameters<typeof window.history.pushState>) => {
      this.originalPushState(...args)
      this.updateState()
    }).bind(this)

    this.originalReplaceState = window.history.replaceState.bind(window.history)
    window.history.replaceState = ((...args: Parameters<typeof window.history.replaceState>) => {
      this.originalReplaceState(...args)
      this.updateState()
    }).bind(this)
  }

  private originalPushState: typeof window.history.pushState
  private originalReplaceState: typeof window.history.replaceState

  public [Symbol.dispose]() {
    window.removeEventListener('popstate', this.popStateListener)
    window.removeEventListener('hashchange', this.hashChangeListener)
    this.onLocationPathChanged[Symbol.dispose]()
    this.onLocationSearchChanged[Symbol.dispose]()
    this.onDeserializedLocationSearchChanged[Symbol.dispose]()
    this.locationDeserializerObserver[Symbol.dispose]()

    window.history.pushState = this.originalPushState
    window.history.replaceState = this.originalReplaceState
  }

  /**
   * Observable value that will be updated when the location pathname (e.g. /page/1) changes
   */
  public onLocationPathChanged = new ObservableValue(new URL(location.href).pathname)

  /**
   * Observable value that will be updated when the location hash (e.g. #hash) changes
   */
  public onLocationHashChanged = new ObservableValue(location.hash.replace('#', ''))

  /**
   * Observable value that will be updated when the location search (e.g. ?search=1) changes
   */
  public onLocationSearchChanged = new ObservableValue<string>(location.search)

  public onDeserializedLocationSearchChanged: ObservableValue<Record<string, unknown>>

  public locationDeserializerObserver = this.onLocationSearchChanged.subscribe((search) => {
    this.onDeserializedLocationSearchChanged.setValue(this.deserializeQueryString(search))
  })

  public updateState = (() => {
    this.onLocationPathChanged.setValue(location.pathname)
    this.onLocationHashChanged.setValue(location.hash.replace('#', ''))
    this.onLocationSearchChanged.setValue(location.search)
  }).bind(this)

  public readonly searchParamObservables = new Map<string, ObservableValue<any>>()

  /**
   * Gets or creates an observable for a search parameter
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

  private popStateListener = (_ev: PopStateEvent) => {
    this.updateState()
  }

  private hashChangeListener = ((_ev: HashChangeEvent) => {
    this.updateState()
  }).bind(this)
}

/**
 * Configures custom serialization for URL search state.
 * Must be called **before** `LocationService` is first instantiated by the injector.
 * @param injector The root injector
 * @param serialize Function to serialize state to a query string
 * @param deserialize Function to deserialize a query string to state
 */
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

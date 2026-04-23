import type { Injector, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import {
  deserializeQueryString as defaultDeserializeQueryString,
  serializeToQueryString as defaultSerializeToQueryString,
} from '@furystack/rest'
import { ObservableValue } from '@furystack/utils'

/**
 * Overridable settings for {@link LocationService}. Bind a replacement factory
 * via {@link useCustomSearchStateSerializer} to swap the URL query-string
 * (de)serializers used by the service.
 */
export interface LocationServiceSettings {
  serialize: typeof defaultSerializeToQueryString
  deserialize: typeof defaultDeserializeQueryString
}

export const LocationServiceSettings: Token<LocationServiceSettings, 'singleton'> = defineService({
  name: '@furystack/shades/LocationServiceSettings',
  lifetime: 'singleton',
  factory: () => ({
    serialize: defaultSerializeToQueryString,
    deserialize: defaultDeserializeQueryString,
  }),
})

/**
 * Singleton service that tracks browser location changes (pathname, search, hash)
 * and exposes them as observable values for reactive routing and URL-driven state.
 */
export interface LocationService {
  readonly deserializeQueryString: typeof defaultDeserializeQueryString
  readonly onLocationPathChanged: ObservableValue<string>
  readonly onLocationHashChanged: ObservableValue<string>
  readonly onLocationSearchChanged: ObservableValue<string>
  readonly onDeserializedLocationSearchChanged: ObservableValue<Record<string, unknown>>
  readonly searchParamObservables: Map<string, ObservableValue<any>>
  /**
   * Synchronizes the observable state with the current browser location.
   * Called internally after navigation events and history state changes.
   */
  updateState(): void
  /**
   * Navigate to a path. Use this instead of raw history.pushState for SPA routing.
   */
  navigate(path: string): void
  /**
   * Replace the current history entry with a new path. Use this instead of raw
   * history.replaceState for SPA redirects where the intermediate URL should
   * not appear in the browser's back/forward stack.
   */
  replace(path: string): void
  /**
   * Gets or creates an observable for a search parameter.
   */
  useSearchParam<T>(key: string, defaultValue: T): ObservableValue<T>
}

export const LocationService: Token<LocationService, 'singleton'> = defineService({
  name: '@furystack/shades/LocationService',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const { serialize, deserialize } = inject(LocationServiceSettings)

    const onLocationPathChanged = new ObservableValue(new URL(location.href).pathname)
    const onLocationHashChanged = new ObservableValue(location.hash.replace('#', ''))
    const onLocationSearchChanged = new ObservableValue<string>(location.search)
    const onDeserializedLocationSearchChanged = new ObservableValue<Record<string, unknown>>(
      deserialize(location.search),
    )
    const searchParamObservables = new Map<string, ObservableValue<any>>()

    const updateState = (): void => {
      onLocationPathChanged.setValue(location.pathname)
      onLocationHashChanged.setValue(location.hash.replace('#', ''))
      onLocationSearchChanged.setValue(location.search)
    }

    const locationDeserializerObserver = onLocationSearchChanged.subscribe((search) => {
      onDeserializedLocationSearchChanged.setValue(deserialize(search))
    })

    const popStateListener = (_ev: PopStateEvent): void => {
      updateState()
    }
    const hashChangeListener = (_ev: HashChangeEvent): void => {
      updateState()
    }
    window.addEventListener('popstate', popStateListener)
    window.addEventListener('hashchange', hashChangeListener)

    const originalPushState = window.history.pushState.bind(window.history)
    window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
      originalPushState(...args)
      updateState()
    }

    const originalReplaceState = window.history.replaceState.bind(window.history)
    window.history.replaceState = (...args: Parameters<typeof window.history.replaceState>) => {
      originalReplaceState(...args)
      updateState()
    }

    const navigate = (path: string): void => {
      // eslint-disable-next-line furystack/prefer-location-service -- This IS the LocationService.navigate() implementation.
      history.pushState(null, '', path)
      updateState()
    }

    const replace = (path: string): void => {
      // eslint-disable-next-line furystack/prefer-location-service -- This IS the LocationService.replace() implementation.
      history.replaceState(null, '', path)
      updateState()
    }

    const useSearchParam = <T,>(key: string, defaultValue: T): ObservableValue<T> => {
      const existing = searchParamObservables.get(key)
      if (existing) return existing as ObservableValue<T>

      const currentDeserialized = onDeserializedLocationSearchChanged.getValue()
      const actualValue = Object.prototype.hasOwnProperty.call(currentDeserialized, key)
        ? (currentDeserialized[key] as T)
        : defaultValue

      const newObservable = new ObservableValue(actualValue)
      searchParamObservables.set(key, newObservable)

      newObservable.subscribe((value) => {
        const currentQueryStringObject = onDeserializedLocationSearchChanged.getValue()
        if (currentQueryStringObject[key] !== value) {
          const params = serialize({ ...currentQueryStringObject, [key]: value })
          const newUrl = `${location.pathname}?${params}`
          // eslint-disable-next-line furystack/prefer-location-service -- Internal LocationService plumbing for search param sync.
          history.pushState({}, '', newUrl)
        }
      })

      onDeserializedLocationSearchChanged.subscribe((search) => {
        const value = (search[key] as T) ?? defaultValue
        searchParamObservables.get(key)?.setValue(value)
      })

      return newObservable
    }

    onDispose(() => {
      window.removeEventListener('popstate', popStateListener)
      window.removeEventListener('hashchange', hashChangeListener)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      locationDeserializerObserver[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      onLocationSearchChanged[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      onDeserializedLocationSearchChanged[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      onLocationPathChanged[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      onLocationHashChanged[Symbol.dispose]()
    })

    return {
      deserializeQueryString: deserialize,
      onLocationPathChanged,
      onLocationHashChanged,
      onLocationSearchChanged,
      onDeserializedLocationSearchChanged,
      searchParamObservables,
      updateState,
      navigate,
      replace,
      useSearchParam,
    }
  },
})

/**
 * Configures custom (de)serialization for URL search state. Rebinds
 * {@link LocationServiceSettings} on the given injector and invalidates the
 * cached {@link LocationService} so the next resolution uses the new
 * serializers. Call **before** {@link LocationService} consumers resolve it
 * for the first time — calling afterwards silently drops the previous
 * instance (listeners won't be torn down until the injector is disposed).
 * @param injector The root injector.
 * @param serialize Function to serialize state to a query string.
 * @param deserialize Function to deserialize a query string to state.
 */
export const useCustomSearchStateSerializer = (
  injector: Injector,
  serialize: typeof defaultSerializeToQueryString,
  deserialize: typeof defaultDeserializeQueryString,
): void => {
  injector.bind(LocationServiceSettings, () => ({ serialize, deserialize }))
  injector.invalidate(LocationServiceSettings)
  injector.invalidate(LocationService)
}

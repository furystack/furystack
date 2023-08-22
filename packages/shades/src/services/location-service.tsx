import type { Disposable } from '@furystack/utils'
import { ObservableValue, Trace } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { deserializeQueryString, serializeToQueryString } from '@furystack/rest'
@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.updateState)
    window.removeEventListener('hashchange', this.updateState)
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

  public onDeserializedLocationSearchChanged = new ObservableValue(
    deserializeQueryString(this.onLocationSearchChanged.getValue()),
  )

  public locationDeserializerObserver = this.onLocationSearchChanged.subscribe((search) => {
    this.onDeserializedLocationSearchChanged.setValue(deserializeQueryString(search))
  })

  public updateState() {
    this.onLocationPathChanged.setValue(location.pathname)
    this.onLocationHashChanged.setValue(location.hash)
    this.onLocationSearchChanged.setValue(location.search)
  }

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
      const actualValue = (this.onDeserializedLocationSearchChanged.getValue()[key] as T) ?? defaultValue
      const newObservable = new ObservableValue(actualValue)
      this.searchParamObservables.set(key, newObservable)

      newObservable.subscribe((value) => {
        const params = serializeToQueryString({ ...deserializeQueryString(location.search), [key]: value })
        const newUrl = `${location.pathname}?${params}`
        history.pushState({}, '', newUrl)
      })

      this.onDeserializedLocationSearchChanged.subscribe((search) => {
        const value = (search[key] as T) ?? defaultValue
        this.searchParamObservables.get(key)?.setValue(value as T)
      })
      return newObservable
    }
    return existing as ObservableValue<T>
  }

  private pushStateTracer: Disposable
  private replaceStateTracer: Disposable

  constructor() {
    window.addEventListener('popstate', () => this.updateState())
    window.addEventListener('hashchange', () => this.updateState())

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
  }
}

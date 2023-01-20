import type { Disposable } from '@furystack/utils'
import { ObservableValue, Trace } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.updateState)
    window.removeEventListener('hashchange', this.updateState)
    this.pushStateTracer.dispose()
    this.replaceStateTracer.dispose()
    this.onLocationPathChanged.dispose()
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
  public onLocationSearchChanged = new ObservableValue(location.search)

  public updateState() {
    this.onLocationPathChanged.setValue(location.pathname)
    this.onLocationHashChanged.setValue(location.hash)
    this.onLocationSearchChanged.setValue(location.search)
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

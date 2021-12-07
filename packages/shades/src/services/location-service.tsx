import { Disposable, ObservableValue, Trace } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.updateState)
    window.removeEventListener('hashchange', this.updateState)
    this.pushStateTracer.dispose()
    this.replaceStateTracer.dispose()
    this.onLocationChanged.dispose()
  }

  public onLocationChanged = new ObservableValue(new URL(location.href).pathname)

  public updateState() {
    const newUrl = new URL(location.href)
    this.onLocationChanged.setValue(newUrl.pathname)
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

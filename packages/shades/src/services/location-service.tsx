import { Disposable, ObservableValue, Trace } from '@sensenet/client-utils'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.updateState)
    window.removeEventListener('hashchange', this.updateState)
    this.pushStateTracer.dispose()
    this.replaceStateTracer.dispose()
  }

  public onLocationChanged = new ObservableValue<URL>(new URL(location.href))

  private updateState() {
    this.onLocationChanged.setValue(new URL(location.href))
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

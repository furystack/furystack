import { Disposable, ObservableValue, Trace } from '@furystack/utils'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'

@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.updateState)
    window.removeEventListener('hashchange', this.updateState)
    this.pushStateTracer.dispose()
    this.replaceStateTracer.dispose()
    this.logger.verbose({ message: 'Location service disposed.' })
  }

  public onLocationChanged = new ObservableValue<URL>(new URL(location.href))

  private updateState() {
    const newUrl = new URL(location.href)
    this.logger.verbose({ message: 'Location changed', data: { oldUrl: this.onLocationChanged.getValue(), newUrl } })
    this.onLocationChanged.setValue(newUrl)
  }

  private pushStateTracer: Disposable
  private replaceStateTracer: Disposable

  private logger: ScopedLogger

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/shades/location-service')
    this.logger.verbose({ message: 'Starting Location service...' })
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

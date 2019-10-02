import { Disposable, ObservableValue } from '@sensenet/client-utils'
import { Injectable } from '@furystack/inject'

export type LocationType = { data: any; title?: string; url?: string }

@Injectable({ lifetime: 'singleton' })
export class LocationService implements Disposable {
  public dispose() {
    window.removeEventListener('popstate', this.onPopStateHandler)
    window.removeEventListener('hashchange', this.onHashChangedHandler)
    window.removeEventListener('pushstate' as any, this.onPushStateHandler)
    window.removeEventListener('replacestate' as any, this.onPushStateHandler)
    history.pushState = this.oldPushState
    history.replaceState = this.oldReplaceState
  }

  public onLocationChanged = new ObservableValue<LocationType>({
    data: null,
    title: document.title,
    url: window.location.pathname,
  })

  private onPopStateHandler(ev: PopStateEvent) {
    this.onLocationChanged.setValue(ev.state)
  }

  private onHashChangedHandler(ev: HashChangeEvent) {
    this.onLocationChanged.setValue(history.state)
  }

  private onPushStateHandler(ev: PopStateEvent) {
    this.onLocationChanged.setValue(ev.state)
  }

  private onReplaceStateHandler(ev: PopStateEvent) {
    this.onLocationChanged.setValue(ev.state)
  }

  private oldPushState = history.pushState
  private oldReplaceState = history.replaceState

  constructor() {
    window.addEventListener('popstate', ev => this.onPopStateHandler(ev))
    window.addEventListener('hashchange', ev => this.onHashChangedHandler(ev))
    window.addEventListener('pushstate' as any, ev => this.onPushStateHandler(ev))
    window.addEventListener('replacestate' as any, ev => this.onReplaceStateHandler(ev))
    history.pushState = (data: any, title: string, url?: string | null | undefined) => {
      this.oldPushState.apply(history, [data, title, url])
      const ev = new PopStateEvent('pushstate', {
        state: { data, title, url },
      })
      window.dispatchEvent(ev)
    }

    history.replaceState = (data: any, title: string, url?: string | null | undefined) => {
      this.oldReplaceState.apply(history, [data, title, url])
      const ev = new PopStateEvent('replacestate', {
        state: { data, title, url },
      })
      window.dispatchEvent(ev)
    }
  }
}

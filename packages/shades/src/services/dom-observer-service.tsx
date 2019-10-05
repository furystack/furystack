import { Injectable } from '@furystack/inject'
import { isJsxElement } from '../jsx'

/**
 * Service that observes the DOM and triggers callbacks (like attached / detached)
 */
@Injectable({ lifetime: 'singleton' })
export class DomObserverService {
  /**
   * Ensures that the service is up and running
   */
  public EnsureStarted() {
    if (!this._isRunning) {
      this.mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
      this._isRunning = true
    }
  }

  private _isRunning = false

  private mutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(n => {
        if (n instanceof HTMLElement) {
          const children = n.querySelectorAll('*')
          children.forEach(child => this.attachJsxElement(child as any))
          this.attachJsxElement(n as any)
        }
      })
      mutation.removedNodes.forEach(n => {
        if (n instanceof HTMLElement) {
          const children = (n as HTMLElement).querySelectorAll('*')
          children.forEach(child => this.detachJsxElement(child as any))
          this.detachJsxElement(n as any)
        }
      })
    })
  })

  private attachJsxElement(n: HTMLElement | JSX.Element) {
    if (isJsxElement(n)) {
      n.onAttached.setValue(Math.random() as any)
    }
  }

  private detachJsxElement(n: HTMLElement | JSX.Element) {
    if (isJsxElement(n)) {
      n.onDetached.setValue(Math.random() as any)
    }
  }
}

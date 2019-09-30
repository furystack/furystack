import { Injectable } from '@furystack/inject'

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
        const children = (n as HTMLElement).querySelectorAll('*')
        children.forEach(child => this.attachJsxElement(child))
        this.attachJsxElement(n)
      })
      mutation.removedNodes.forEach(n => {
        const children = (n as HTMLElement).querySelectorAll('*')
        children.forEach(child => this.detachJsxElement(child))
        this.detachJsxElement(n)
      })
    })
  })

  private attachJsxElement(n: Node) {
    const jsxElement: JSX.Element = n as JSX.Element
    jsxElement.onAttached && jsxElement.onAttached()
  }

  private detachJsxElement(n: Node) {
    const jsxElement: JSX.Element = n as JSX.Element
    jsxElement.onDetached && jsxElement.onDetached()
  }
}

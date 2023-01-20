import type { Disposable } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { ChildrenList, RenderOptions } from './models'
import { ResourceManager } from './services/resource-manager'

export type ShadeOptions<TProps> = {
  /**
   * Explicit shadow dom name. Will fall back to 'shade-{guid}' if not provided
   */
  shadowDomName: string

  /**
   * Render hook, this method will be executed on each and every render.
   */
  render: (options: RenderOptions<TProps>) => JSX.Element | string | null

  /**
   * Construct hook. Will be executed once when the element has been constructed and initialized
   */
  constructed?: (
    options: RenderOptions<TProps>,
  ) => void | undefined | (() => void) | Promise<void | undefined | (() => void)>

  /**
   * Will be executed when the element is attached to the DOM.
   */
  onAttach?: (options: RenderOptions<TProps>) => void

  /**
   * Will be executed when the element is detached from the DOM.
   */
  onDetach?: (options: RenderOptions<TProps>) => void

  /**
   * A factory method that creates a list of disposable resources that will be disposed when the element is detached.
   */
  resources?: (options: RenderOptions<TProps>) => Disposable[]
}

/**
 * Factory method for creating Shade components
 *
 * @param o for component creation
 * @returns the JSX element
 */
export const Shade = <TProps>(o: ShadeOptions<TProps>) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName

  const existing = customElements.get(customElementName)
  if (!existing) {
    customElements.define(
      customElementName,
      class extends HTMLElement implements JSX.Element {
        public resourceManager = new ResourceManager()

        public connectedCallback() {
          o.onAttach && o.onAttach(this.getRenderOptions())
          this.callConstructed()
        }

        public disconnectedCallback() {
          o.onDetach && o.onDetach(this.getRenderOptions())
          this.resourceManager.dispose()
          this.cleanup && this.cleanup()
        }

        /**
         * Will be triggered when updating the external props object
         */
        public props!: TProps & { children?: JSX.Element[] }

        /**
         * Will be updated when on children change
         */
        public shadeChildren?: ChildrenList

        /**
         * @param options Options for rendering the component
         * @returns the JSX element
         */
        public render = (options: RenderOptions<TProps>) => o.render(options)

        /**
         * @returns values for the current render options
         */
        private getRenderOptions = (): RenderOptions<TProps> => {
          const renderOptions: RenderOptions<TProps> = {
            props: this.props,
            injector: this.injector,

            children: this.shadeChildren,
            element: this,
            useObservable: (key, obesrvable, callback, getLast) =>
              this.resourceManager.useObservable(key, obesrvable, callback || (() => this.updateComponent()), getLast),
            useState: (key, initialValue) =>
              this.resourceManager.useState(key, initialValue, this.updateComponent.bind(this)),
            useDisposable: this.resourceManager.useDisposable.bind(this.resourceManager),
          }

          return renderOptions as RenderOptions<TProps>
        }

        /**
         * Updates the component in the DOM.
         */
        public updateComponent() {
          const renderResult = this.render(this.getRenderOptions())

          if (renderResult === null || renderResult === undefined) {
            this.innerHTML = ''
          }

          if (typeof renderResult === 'string' || typeof renderResult === 'number') {
            this.innerHTML = renderResult
          }

          if (renderResult instanceof HTMLElement) {
            this.replaceChildren(renderResult)
          }
          if (renderResult instanceof DocumentFragment) {
            this.replaceChildren(renderResult)
          }
        }

        /**
         * Finialize the component initialization after it gets the Props. Called by the framework internally
         */
        public callConstructed() {
          this.updateComponent()
          const cleanupResult = o.constructed && o.constructed(this.getRenderOptions())
          if (cleanupResult instanceof Promise) {
            cleanupResult.then((cleanup) => (this.cleanup = cleanup))
          } else {
            // construct is not async
            this.cleanup = cleanupResult
          }
        }

        private cleanup: void | (() => void) = undefined

        private _injector?: Injector

        private getInjectorFromParent(): Injector | void {
          let parent = this.parentElement
          while (parent) {
            if ((parent as JSX.Element).injector) {
              return (parent as JSX.Element).injector
            }
            parent = parent.parentElement
          }
        }

        public get injector(): Injector {
          if (this._injector) {
            return this._injector
          }

          const fromProps = (this.props as any)?.injector
          if (fromProps && fromProps instanceof Injector) {
            return fromProps
          }

          const fromParent = this.getInjectorFromParent()
          if (fromParent) {
            this._injector = fromParent
            return fromParent
          }
          // Injector not set explicitly and not found on parents!
          return new Injector()
        }

        public set injector(i: Injector) {
          this._injector = i
        }
      },
    )
  } else {
    throw Error(`A custom shade with shadow DOM name '${o.shadowDomName}' has already been registered!`)
  }

  return (props: TProps, children: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...(props as TProps & ElementCreationOptions),
    }) as JSX.Element<TProps>
    el.props = props || ({} as TProps)
    el.shadeChildren = children
    return el as JSX.Element
  }
}

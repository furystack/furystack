import type { Disposable } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { RenderOptions } from './models/render-options.js'
import type { ChildrenList } from './models/children-list.js'
import type { PartialElement } from './models/partial-element.js'

export type ShadeOptions<TProps, TState> = {
  /**
   * Explicit shadow dom name. Will fall back to 'shade-{guid}' if not provided
   */
  shadowDomName: string

  /**
   * Render hook, this method will be executed on each and every render.
   */
  render: (options: RenderOptions<TProps, TState>) => JSX.Element | string | null

  /**
   * Construct hook. Will be executed once when the element has been constructed and initialized
   */
  constructed?: (
    options: RenderOptions<TProps, TState>,
  ) => void | undefined | (() => void) | Promise<void | undefined | (() => void)>

  /**
   * Will be executed when the element is attached to the DOM.
   */
  onAttach?: (options: RenderOptions<TProps, TState>) => void

  /**
   * Will be executed when the element is detached from the DOM.
   */
  onDetach?: (options: RenderOptions<TProps, TState>) => void

  /**
   * A factory method that creates a list of disposable resources that will be disposed when the element is detached.
   */
  resources?: (options: RenderOptions<TProps, TState>) => Disposable[]

  /**
   * An optional method that checks the state for changes and returns true if the element should be rerendered. This will not be called if `skipRender` is set to true in the relevant `updateState()` call.
   */
  compareState?: (options: {
    oldState: TState
    newState: TState
    props: TProps
    element: HTMLElement
    injector: Injector
  }) => boolean
} & (unknown extends TState
  ? {}
  : {
      /**
       * The initial state of the component
       */
      getInitialState: (options: { injector: Injector; props: TProps }) => TState
    })

/**
 * Factory method for creating Shade components
 *
 * @param o for component creation
 * @returns the JSX element
 */
export const Shade = <TProps, TState = unknown>(o: ShadeOptions<TProps, TState>) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName

  const existing = customElements.get(customElementName)
  if (!existing) {
    customElements.define(
      customElementName,
      class extends HTMLElement implements JSX.Element {
        private compareState =
          o.compareState ||
          (({ oldState, newState }: { oldState: TState; newState: TState }) =>
            Object.entries(oldState as object).some(([key, value]) => value !== newState[key as keyof TState]) ||
            Object.entries(newState as object).some(([key, value]) => value !== oldState[key as keyof TState]))

        public connectedCallback() {
          o.onAttach && o.onAttach(this.getRenderOptions())
          this.callConstructed()
        }

        public disconnectedCallback() {
          o.onDetach && o.onDetach(this.getRenderOptions())
          Object.values(this.resources).forEach((s) => s.dispose())
          this.cleanup && this.cleanup()
        }

        /**
         * Will be triggered when updating the external props object
         */
        public props: TProps & { children?: JSX.Element[] }

        /**
         * Will be triggered on state update
         */
        public state!: TState

        /**
         * Will be updated when on children change
         */
        public shadeChildren?: ChildrenList

        /**
         * @param options Options for rendering the component
         * @returns the JSX element
         */
        public render = (options: RenderOptions<TProps, TState>) => o.render(options)

        /**
         * @returns values for the current render options
         */
        private getRenderOptions = (): RenderOptions<TProps, TState> => {
          const props: TProps = { ...this.props }
          const getState = () => ({ ...this.state })
          const updateState = (stateChanges: PartialElement<TState>, skipRender?: boolean) => {
            const oldState = { ...this.state }
            const newState = { ...oldState, ...stateChanges }

            this.state = newState

            if (
              !skipRender &&
              this.compareState({
                oldState,
                newState,
                props,
                element: this,
                injector: this.injector,
              })
            ) {
              this.updateComponent()
            }
          }

          const returnValue = {
            ...{
              props,
              injector: this.injector,

              children: this.shadeChildren,
              element: this,
            },
            ...((o as any).getInitialState
              ? {
                  getState,
                  updateState,
                }
              : {}),
          } as any as RenderOptions<TProps, TState>

          return returnValue
        }

        private createResources() {
          this.resources.push(...(o.resources?.(this.getRenderOptions()) || []))
        }

        /**
         * Updates the component in the DOM.
         */
        public updateComponent() {
          const renderResult = this.render(this.getRenderOptions())

          if (renderResult === null) {
            this.innerHTML = ''
          }

          if (typeof renderResult === 'string') {
            this.innerHTML = renderResult
          }

          if (renderResult instanceof DocumentFragment) {
            this.replaceChildren(...renderResult.children)
          }

          if (renderResult instanceof HTMLElement) {
            if (this.hasChildNodes()) {
              this.replaceChild(renderResult, this.firstChild as Node)
            } else {
              this.append(renderResult)
            }
          }
        }

        /**
         * Finialize the component initialization after it gets the Props. Called by the framework internally
         */
        public callConstructed() {
          ;(o as any).getInitialState &&
            (this.state = (o as any).getInitialState({ props: { ...this.props }, injector: this.injector }))

          this.updateComponent()
          this.createResources()
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

          const fromState = (this.state as any)?.injector
          if (fromState && fromState instanceof Injector) {
            return fromState
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

        private resources: Disposable[] = []

        constructor(_props: TProps & { children?: JSX.Element[] }) {
          super()
          this.props = _props
        }
      },
    )
  } else {
    throw Error(`A custom shade with shadow DOM name '${o.shadowDomName}' has already been registered!`)
  }

  return (props: TProps, children: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...(props as TProps & ElementCreationOptions),
    }) as JSX.Element<TProps, TState>
    el.props = props

    el.shadeChildren = children
    return el as JSX.Element
  }
}

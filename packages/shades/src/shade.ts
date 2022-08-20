import { Disposable, ObservableValue } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { ChildrenList, PartialElement, RenderOptions, ShadeComponent } from './models'

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
   * An optional method that checks the state for changes and returns true if the element should be rerendered.
   */
  compareState?: (oldState: TState, newState: TState) => boolean
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
          ((oldState: TState, newState: TState) =>
            Object.entries(oldState).some(([key, value]) => value !== newState[key as keyof TState]) ||
            Object.entries(newState).some(([key, value]) => value !== oldState[key as keyof TState]))

        public connectedCallback() {
          o.onAttach && o.onAttach(this.getRenderOptions())
          this.callConstructed()
        }

        public disconnectedCallback() {
          o.onDetach && o.onDetach(this.getRenderOptions())
          Object.values(this.resources).forEach((s) => s.dispose())
          this.cleanup && this.cleanup()
          this.shadeChildren.dispose()
          this.props.dispose()
          this.state.dispose()
        }

        /**
         * Will be triggered when updating the external props object
         */
        public props: ObservableValue<TProps & { children?: JSX.Element[] }>

        /**
         * Will be triggered on state update
         */
        public state: ObservableValue<TState>

        /**
         * Will be updated when on children change
         */
        public shadeChildren = new ObservableValue<ChildrenList | undefined>([])

        /**
         * @param options Options for rendering the component
         * @returns the JSX element
         */
        public render = (options: RenderOptions<TProps, TState>) => o.render(options)

        /**
         * @returns values for the current render options
         */
        private getRenderOptions = () => {
          const props = this.props.getValue() || {}
          const getState = () => this.state.getValue()
          const updateState = (stateChanges: PartialElement<TState>, skipRender?: boolean) => {
            const currentState = this.state.getValue()
            const newState = { ...currentState, ...stateChanges }
            if (this.compareState(currentState, newState)) {
              this.state.setValue(newState)
              !skipRender && this.updateComponent()
            }
          }

          const returnValue: RenderOptions<TProps, TState> = {
            props,
            getState,
            injector: this.injector,
            updateState,
            children: this.shadeChildren.getValue(),
            element: this,
          }

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
          if (this.props.isDisposed) {
            return
          }

          ;(o as any).getInitialState &&
            this.state.setValue((o as any).getInitialState({ props: this.props.getValue(), injector: this.injector }))

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

          const fromState = (this.state.getValue() as any)?.injector
          if (fromState && fromState instanceof Injector) {
            return fromState
          }

          const fromProps = (this.props.getValue() as any)?.injector
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

        constructor(_props: TProps) {
          super()
          this.props = new ObservableValue()
          this.state = new ObservableValue()
        }
      } as any as CustomElementConstructor,
    )
  } else {
    throw Error(`A custom shade with shadow DOM name '${o.shadowDomName}' has already been registered!`)
  }

  const comp: ShadeComponent<TProps> = (props: TProps, children?: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...props,
    }) as JSX.Element<TProps, TState>
    el.props.setValue(props)

    el.shadeChildren.setValue(children)
    return el as JSX.Element
  }
  comp.isShadeComponent = true

  return comp
}

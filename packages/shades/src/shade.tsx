import { ObservableValue } from '@furystack/utils'
import { v4 } from 'uuid'
import { Injector } from '@furystack/inject'
import { ChildrenList, RenderOptions } from './models'

export interface ShadeOptions<TProps, TState> {
  /**
   * The initial state of the component
   */
  initialState?: TState
  /**
   * Explicit shadow dom name. Will fall back to 'shade-{guid}' if not provided
   */
  shadowDomName?: string
  /**
   * Render hook, this method will be executed on each and every render.
   */
  render: (options: RenderOptions<TProps, TState>) => JSX.Element

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
}

/**
 * Factory method for creating Shade components
 * @param o Options for component creation
 */
export const Shade = <TProps, TState = undefined>(o: ShadeOptions<TProps, TState>) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName || `shade-${v4()}`

  const existing = customElements.get(customElementName)
  if (!existing) {
    customElements.define(
      customElementName,
      class extends HTMLElement implements JSX.Element {
        public connectedCallback() {
          o.onAttach && o.onAttach(this.getRenderOptions())
          this.callConstructed()
        }

        public disconnectedCallback() {
          o.onDetach && o.onDetach(this.getRenderOptions())
          this.props.dispose()
          this.state.dispose()
          this.shadeChildren.dispose()
          this.cleanup && this.cleanup()
        }

        /**
         * Will be triggered when updating the external props object
         */
        public props: ObservableValue<TProps & { children?: JSX.Element[] }>

        /**
         * Will be triggered on state update
         */
        public state = new ObservableValue(o.initialState)

        /**
         * Will be updated when on children change
         */
        public shadeChildren = new ObservableValue<ChildrenList>([])

        /**
         * Method that returns the JSX element
         */
        public render = (options: RenderOptions<TProps, TState>) => o.render(options)

        /**
         * Returns values for the current render options
         */
        private getRenderOptions = () => {
          const props = this.props.getValue()
          const getState = () => this.state.getValue()
          return {
            props,
            getState,
            injector: this.injector,
            updateState: (newState, skipRender) => {
              this.state.setValue({ ...this.state.getValue(), ...newState })
              !skipRender && this.updateComponent()
            },
            children: this.shadeChildren.getValue(),
            element: this,
            logger: this.injector.logger.withScope(`@furystack/shades/<${customElementName}>`),
          } as RenderOptions<TProps, TState>
        }

        /**
         * Updates the component in the DOM.
         */
        public async updateComponent() {
          const newJsx = this.render(this.getRenderOptions())

          // const selectionState = this.getSelectionState()

          if (this.hasChildNodes()) {
            this.replaceChild(newJsx, this.firstChild as Node)
            // selectionState && this.restoreSelectionState(selectionState)
          } else {
            this.append(newJsx)
          }
        }

        /**
         * Finialize the component initialization after it gets the Props. Called by the framework internally
         */
        public callConstructed() {
          this.updateComponent()
          const cleanupResult = o.constructed && o.constructed(this.getRenderOptions())
          if (cleanupResult instanceof Promise) {
            cleanupResult.then(cleanup => (this.cleanup = cleanup))
          } else {
            // construct is not async
            // this.cleanup = this.cleanup
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
          throw Error('Injector not set explicitly and not found on parents!')
        }

        public set injector(i: Injector) {
          this._injector = i
        }

        constructor(_props: TProps) {
          super()
          this.props = new ObservableValue()
        }
      },
    )
  }

  return (props: TProps, children: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...props,
    }) as JSX.Element<TProps, TState>
    el.props.setValue(props)
    el.shadeChildren.setValue(children)
    return el as JSX.Element
  }
}

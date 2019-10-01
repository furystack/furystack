import { ObservableValue } from '@sensenet/client-utils'
import { v4 } from 'uuid'
import { shadeInjector } from './shade-component'
import { RenderOptions } from './models/render-options'
import { ChildrenList } from './models/children-list'

export interface ShadeOptions<TProps, TState> {
  /**
   * The initial state of the component
   */
  initialState: TState
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
  construct?: (options: RenderOptions<TProps, TState>) => void

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
export const Shade = <TProps, TState>(o: ShadeOptions<TProps, TState>) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName || `shade-${v4()}`

  const existing = customElements.get(customElementName)
  if (!existing) {
    customElements.define(
      customElementName,
      class extends HTMLElement {
        /**
         * Will be triggered when the element is attached to the DOM
         */
        public onAttached = new ObservableValue<void>()

        /**
         * Will be triggered when the element is detached from the DOM
         */
        public onDetached = new ObservableValue<void>()

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
        private getRenderOptions(): RenderOptions<TProps, TState> {
          const props = this.props.getValue()
          const getState = () => this.state.getValue()
          return {
            props,
            getState,
            injector: shadeInjector,
            updateState: newState => this.state.setValue({ ...this.state.getValue(), ...newState }),
            children: this.shadeChildren.getValue(),
          }
        }

        /**
         * Updates the component in the DOM.
         */
        public updateComponent() {
          const newJsx = this.render(this.getRenderOptions())
          this.innerHTML = ''
          this.append(newJsx)
          return newJsx
        }

        /**
         * Finialize the component initialization after it gets the Props. Called by the framework internally
         */
        public callConstruct() {
          o.construct && o.construct(this.getRenderOptions())
          this.props.subscribe(() => this.updateComponent())
        }

        constructor(_props: TProps) {
          super()
          this.props = new ObservableValue()
          this.state.subscribe(() => this.updateComponent())
          this.shadeChildren.subscribe(() => this.updateComponent())

          o.onAttach && this.onAttached.subscribe(() => o.onAttach && o.onAttach(this.getRenderOptions()))
          o.onDetach && this.onDetached.subscribe(() => o.onDetach && o.onDetach(this.getRenderOptions()))

          this.onDetached.subscribe(() => {
            this.props.dispose()
            this.state.dispose()
            this.shadeChildren.dispose()
            this.onAttached.dispose()
            this.onDetached.dispose()
          })
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
    el.callConstruct()
    return el as JSX.Element
  }
}

import { Disposable, ObservableValue, ValueObserver } from '@furystack/utils'
import { v4 } from 'uuid'
import { Injector } from '@furystack/inject'
import { ChildrenList, PartialElement, RenderOptions } from './models'
import { CurrentValuesFromObservables, Observables } from './models/observables'

export type ShadeOptions<TProps, TState, TObservables> = {
  /**
   * Explicit shadow dom name. Will fall back to 'shade-{guid}' if not provided
   */
  shadowDomName?: string
  /**
   * Render hook, this method will be executed on each and every render.
   */
  render: (options: RenderOptions<TProps, TState, TObservables>) => JSX.Element

  /**
   * Construct hook. Will be executed once when the element has been constructed and initialized
   */
  constructed?: (
    options: RenderOptions<TProps, TState, TObservables>,
  ) => void | undefined | (() => void) | Promise<void | undefined | (() => void)>

  /**
   * Will be executed when the element is attached to the DOM.
   */
  onAttach?: (options: RenderOptions<TProps, TState, TObservables>) => void

  /**
   * Will be executed when the element is detached from the DOM.
   */
  onDetach?: (options: RenderOptions<TProps, TState, TObservables>) => void
} & (unknown extends TState
  ? {}
  : {
      /**
       * The initial state of the component
       */
      getInitialState: (options: { injector: Injector; props: TProps }) => TState
    }) &
  (TObservables extends Observables
    ? { observables?: (options: RenderOptions<TProps, TState, TObservables>) => TObservables }
    : {})

/**
 * Factory method for creating Shade components
 *
 * @param o for component creation
 * @returns the JSX element
 */
export const Shade = <TProps, TState = unknown, TObservables = unknown>(
  o: ShadeOptions<TProps, TState, TObservables>,
) => {
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
          Object.values(this.observableSubscriptions).forEach((s) => (s as Disposable)?.dispose())
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
        public shadeChildren = new ObservableValue<ChildrenList>([])

        /**
         * @param options Options for rendering the component
         * @returns the JSX element
         */
        public render = (options: RenderOptions<TProps, TState, TObservables>) => o.render(options)

        /**
         * @returns values for the current render options
         */
        private getRenderOptions = () => {
          const props = this.props.getValue() || {}
          const getState = () => this.state.getValue()
          const updateState = (newState: PartialElement<TState>, skipRender?: boolean) => {
            this.state.setValue({ ...this.state.getValue(), ...newState })
            !skipRender && this.updateComponent()
          }
          const getObservableValues = (o as any).observables
            ? () => {
                const keys = Object.keys(this.observableSubscriptions) as Array<keyof TObservables>
                return Object.fromEntries(
                  keys.map((key) => [
                    key,
                    this.observableSubscriptions[
                      key as keyof typeof this.observableSubscriptions
                    ]?.observable.getValue(),
                  ]),
                ) as TObservables extends Observables ? CurrentValuesFromObservables<TObservables> : never
              }
            : undefined

          const returnValue: RenderOptions<TProps, TState, TObservables> = {
            props,
            getState,
            injector: this.injector,
            updateState,
            children: this.shadeChildren.getValue(),
            element: this,
            ...(((o as any).observables ? { getObservableValues } : {}) as any),
          }

          return returnValue
        }

        private updateObservables() {
          this.observableSubscriptions = Object.fromEntries(
            Object.entries(
              (o as any).observables?.(this.getRenderOptions()) || ({} as { [K: string]: ObservableValue<any> }),
            ).map(([key, observableValue]) => [
              key,
              (observableValue as ObservableValue<any>).subscribe(() => this.updateComponent(), false),
            ]),
          ) as any
        }

        /**
         * Updates the component in the DOM.
         */
        public updateComponent() {
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
          ;(o as any).getInitialState &&
            this.state.setValue((o as any).getInitialState({ props: this.props.getValue(), injector: this.injector }))

          this.updateObservables()

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

        private observableSubscriptions: { [K in keyof TObservables]?: ValueObserver<any> } = {}

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

  return (props: TProps, children: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...props,
    }) as JSX.Element<TProps, TState>
    el.props.setValue(props)

    el.shadeChildren.setValue(children)
    return el as JSX.Element
  }
}

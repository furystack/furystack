import type { Disposable } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import type { ChildrenList, PartialElement, RenderOptions, RenderOptionsBase, RenderOptionsState } from './models'
import { ResourceManager } from './services/resource-manager'
import { StateManager } from './services/state-manager'

export type ShadeBaseOptions<TProps, TState> = {
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
}

type ShadeStateOptions<TProps, TState> = {
  /**
   * The initial state of the component
   */
  getInitialState: (options: { injector: Injector; props: TProps }) => TState
}

type ShadeOptions<TProps, TState> = ShadeBaseOptions<TProps, TState> &
  (unknown extends TState ? {} : ShadeStateOptions<TProps, TState>)

/**
 * @param options The Options object
 * @returns a boolean that indicates if the options object contains an initial state getter
 */
export const hasState = <TProps, TState>(options: unknown): options is ShadeStateOptions<TProps, TState> => {
  const initialStateGetter = (options as any as ShadeStateOptions<unknown, Object>).getInitialState
  return initialStateGetter !== undefined && typeof initialStateGetter === 'function'
}

/**
 *
 * @param param0 The object with the two states
 * @param param0.oldState The Old state object
 * @param param0.newState The New state object
 * @returns a boolean that indicates if the state has changed and an update is required
 */
export const defaultStateComparer = <TState>({ oldState, newState }: { oldState: TState; newState: TState }) =>
  oldState !== newState &&
  (Object.entries(oldState as object).some(([key, value]) => value !== newState[key as keyof TState]) ||
    Object.entries(newState as object).some(([key, value]) => value !== oldState[key as keyof TState]))

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
        private resourceManager = new ResourceManager()
        public stateManager!: StateManager<TState>
        private compareState = o.compareState || defaultStateComparer

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

        public get state(): TState {
          return this.stateManager?.getState()
        }

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
          const renderOptionsBase: RenderOptionsBase<TProps, TState> = {
            props: this.props,
            injector: this.injector,

            children: this.shadeChildren,
            element: this,
            useObservable: (key, obesrvable, callback, getLast) =>
              this.resourceManager.useObservable(key, obesrvable, callback || (() => this.updateComponent()), getLast),
            useDisposable: this.resourceManager.useDisposable.bind(this.resourceManager),
          }

          if (hasState(o)) {
            const renderOptionsState: RenderOptionsState<TState> = {
              getState: this.stateManager.getState.bind(this.stateManager),
              updateState: (stateChanges: PartialElement<TState>, skipRender?: boolean) => {
                const { oldState, newState } = this.stateManager.updateState(stateChanges)

                if (
                  !skipRender &&
                  this.compareState({
                    oldState,
                    newState,
                    props: this.props,
                    element: this,
                    injector: this.injector,
                  })
                ) {
                  this.updateComponent()
                }
              },
              useState: <TKey extends keyof TState>(key: TKey) => {
                const [field, setField] = this.stateManager.useState(key)
                const setStateField = (value: TState[TKey], skipRender?: boolean) => {
                  const { oldState, newState } = setField(value)
                  if (
                    !skipRender &&
                    this.compareState({
                      oldState,
                      newState,
                      props: this.props,
                      element: this,
                      injector: this.injector,
                    })
                  ) {
                    this.updateComponent()
                  }
                }
                return [field, setStateField]
              },
            }
            return {
              ...renderOptionsBase,
              ...renderOptionsState,
            } as RenderOptions<TProps, TState>
          }

          return renderOptionsBase as RenderOptions<TProps, TState>
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
          if (hasState(o)) {
            const initialState = o.getInitialState({ props: this.props, injector: this.injector })
            this.stateManager = new StateManager(initialState as TState)
          }
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

          const fromState = (this.stateManager?.getState() as any)?.injector
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

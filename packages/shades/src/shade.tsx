import { ObservableValue } from '@sensenet/client-utils'
import { v4 } from 'uuid'
import '@furystack/logging'
import { shadeInjector } from './shade-component'
import { ChildrenList, RenderOptions, SelectionState } from './models'
import { getPath, getElementFromPath } from './dom-path'

const shadowRoots = new WeakMap<any, ShadowRoot>()

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
  construct?: (
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

  const logger = shadeInjector.logger.withScope(`<${customElementName}>`)

  const existing = customElements.get(customElementName)
  if (!existing) {
    logger.verbose({ message: `Registering Shade...`, data: { options: o } })
    customElements.define(
      customElementName,
      class extends HTMLElement implements JSX.Element {
        public connectedCallback() {
          o.onAttach && o.onAttach(this.getRenderOptions())
        }

        public disconnectedCallback() {
          o.onDetach && o.onDetach(this.getRenderOptions())
          logger.verbose({ message: 'Detaching...', data: this })
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
          const shadowRoot = shadowRoots.get(this) as ShadowRoot
          return {
            props,
            getState,
            injector: shadeInjector,
            updateState: (newState, skipRender) => {
              this.state.setValue({ ...this.state.getValue(), ...newState })
              !skipRender && this.updateComponent()
            },
            children: this.shadeChildren.getValue(),
            element: shadowRoot as any,
            logger,
          } as RenderOptions<TProps, TState>
        }

        private getSelectionState(shadowRoot: ShadowRoot): SelectionState {
          const selection = shadowRoot.getSelection()
          const oldRange = selection && selection.rangeCount && selection.getRangeAt(0)

          return {
            focusedPath: shadowRoot.activeElement ? getPath(shadowRoot, shadowRoot.activeElement) : undefined,
            selectionRange: oldRange
              ? {
                  startOffset: oldRange.startOffset,
                  startContainerPath: getPath(shadowRoot, oldRange.startContainer as Element),
                  endOffset: oldRange.endOffset,
                  endContainerPath: getPath(shadowRoot, oldRange.endContainer as Element),
                }
              : undefined,
          }
        }

        private restoreSelectionState({ focusedPath, selectionRange }: SelectionState, root: ShadowRoot) {
          const firstChild = root.firstChild as HTMLElement
          if (selectionRange) {
            console.log('Selection in range', selectionRange)
            const selection = root.getSelection()
            if (selection) {
              selection.removeAllRanges()
              const newRange = new Range()
              newRange.setStart(
                getElementFromPath(firstChild, selectionRange.startContainerPath),
                selectionRange.startOffset,
              )
              newRange.setEnd(getElementFromPath(firstChild, selectionRange.endContainerPath), selectionRange.endOffset)
              selection.addRange(newRange)
            }
          }
          if (focusedPath) {
            const newFocusedElement = getElementFromPath(firstChild, focusedPath)
            newFocusedElement && (newFocusedElement as any).focus && (newFocusedElement as any).focus()
          }
        }

        /**
         * Updates the component in the DOM.
         */
        public updateComponent() {
          requestAnimationFrame(() => {
            const newJsx = this.render(this.getRenderOptions())
            const shadowRoot = shadowRoots.get(this) as ShadowRoot

            const selectionState = this.getSelectionState(shadowRoot)

            if (shadowRoot.hasChildNodes()) {
              shadowRoot.replaceChild(newJsx, shadowRoot.firstChild as Node)
              selectionState && this.restoreSelectionState(selectionState, shadowRoot)
            } else {
              shadowRoot.append(newJsx)
            }
          })
        }

        /**
         * Finialize the component initialization after it gets the Props. Called by the framework internally
         */
        public callConstruct() {
          const cleanupResult = o.construct && o.construct(this.getRenderOptions())
          if (cleanupResult instanceof Promise) {
            cleanupResult.then(cleanup => (this.cleanup = cleanup))
          } else {
            // construct is not async
            // this.cleanup = this.cleanup
          }
          logger.verbose({
            message: `Creating...`,
            data: this,
          })
          this.updateComponent()
        }

        private cleanup: void | (() => void) = undefined

        constructor(_props: TProps) {
          super()
          const shadowRoot = this.attachShadow({ mode: 'closed' })
          shadowRoots.set(this, shadowRoot)
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
    el.callConstruct()
    return el as JSX.Element
  }
}

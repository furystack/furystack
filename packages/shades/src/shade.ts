import type { Constructable } from '@furystack/inject'
import { hasInjectorReference, Injector } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { ChildrenList, PartialElement, RenderOptions } from './models/index.js'
import { LocationService } from './services/location-service.js'
import { ResourceManager } from './services/resource-manager.js'
import { attachProps, attachStyles } from './shade-component.js'

export type ShadeOptions<TProps, TElementBase extends HTMLElement> = {
  /**
   * Explicit shadow dom name. Will fall back to 'shade-{guid}' if not provided
   */
  shadowDomName: string

  /**
   * Render hook, this method will be executed on each and every render.
   */
  render: (options: RenderOptions<TProps, TElementBase>) => JSX.Element | string | null

  /**
   * Construct hook. Will be executed once when the element has been constructed and initialized
   */
  constructed?: (
    options: RenderOptions<TProps, TElementBase>,
  ) => void | undefined | (() => void) | Promise<void | undefined | (() => void)>

  /**
   * Will be executed when the element is attached to the DOM.
   */
  onAttach?: (options: RenderOptions<TProps, TElementBase>) => void

  /**
   * Will be executed when the element is detached from the DOM.
   */
  onDetach?: (options: RenderOptions<TProps, TElementBase>) => void

  /**
   * Name of the HTML Element's base class. Needs to be defined if the elementBase is set. E.g.: 'div', 'button', 'input'
   */
  elementBaseName?: string

  /**
   * Base class for the custom element. Defaults to HTMLElement. E.g. HTMLButtonElement
   */
  elementBase?: Constructable<TElementBase>

  /**
   * A default style that will be applied to the element. Can be overridden by external styles.
   */
  style?: Partial<CSSStyleDeclaration>
}

/**
 * Factory method for creating Shade components
 * @param o for component creation
 * @returns the JSX element
 */
export const Shade = <TProps, TElementBase extends HTMLElement = HTMLElement>(
  o: ShadeOptions<TProps, TElementBase>,
) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName

  const existing = customElements.get(customElementName)
  if (!existing) {
    const ElementBase = o.elementBase || HTMLElement

    customElements.define(
      customElementName,
      class extends (ElementBase as Constructable<HTMLElement>) implements JSX.Element {
        private _renderCount = 0

        /**
         * @returns the current render count
         */
        public getRenderCount() {
          return this._renderCount
        }

        public resourceManager = new ResourceManager()

        public connectedCallback() {
          o.onAttach?.(this.getRenderOptions())
          this.callConstructed()
        }

        public async disconnectedCallback() {
          o.onDetach?.(this.getRenderOptions())
          await this.resourceManager[Symbol.asyncDispose]()
          this.cleanup?.()
        }

        /**
         * Will be triggered when updating the external props object
         */
        public props!: TProps & { children?: JSX.Element[] } & PartialElement<TElementBase>

        /**
         * Will be updated when on children change
         */
        public shadeChildren?: ChildrenList

        /**
         * @param options Options for rendering the component
         * @returns the JSX element
         */
        public render = (options: RenderOptions<TProps, TElementBase>) => {
          this._renderCount++
          return o.render(options)
        }

        /**
         * @returns values for the current render options
         */
        private getRenderOptions = (): RenderOptions<TProps, TElementBase> => {
          const renderOptions: RenderOptions<TProps, TElementBase> = {
            props: this.props,
            injector: this.injector,
            children: this.shadeChildren,
            element: this,
            renderCount: this._renderCount,
            useObservable: (key, obesrvable, options) => {
              const onChange = options?.onChange || (() => this.updateComponent())
              return this.resourceManager.useObservable(key, obesrvable, onChange, options)
            },
            useState: (key, initialValue) =>
              this.resourceManager.useState(key, initialValue, this.updateComponent.bind(this)),
            useSearchState: (key, initialValue) =>
              this.resourceManager.useObservable(
                `useSearchState-${key}`,
                this.injector.getInstance(LocationService).useSearchParam(key, initialValue),
                () => this.updateComponent(),
              ),

            useStoredState: <T>(key: string, initialValue: T, storageArea = localStorage) => {
              const getFromStorage = () => {
                const value = storageArea?.getItem(key)
                return value ? (JSON.parse(value) as T) : initialValue
              }

              const setToStorage = (value: T) => {
                if (JSON.stringify(value) !== storageArea?.getItem(key)) {
                  const newValue = JSON.stringify(value)
                  storageArea?.setItem(key, newValue)
                }
                if (JSON.stringify(observable.getValue()) !== JSON.stringify(value)) {
                  observable.setValue(value)
                }
              }

              const observable = this.resourceManager.useDisposable(
                `useStoredState-${key}`,
                () => new ObservableValue(getFromStorage()),
              )

              const updateFromStorageEvent = (e: StorageEvent) => {
                if (e.key === key && e.storageArea === storageArea) {
                  setToStorage((e.newValue && (JSON.parse(e.newValue) as T)) || initialValue)
                }
              }

              this.resourceManager.useDisposable(`useStoredState-${key}-storage-event`, () => {
                window.addEventListener('storage', updateFromStorageEvent)
                const channelName = `useStoredState-broadcast-channel`
                const messageChannel = new BroadcastChannel(channelName)
                messageChannel.onmessage = (e: MessageEvent<{ key?: string; value: T }>) => {
                  if (e.data.key === key) {
                    setToStorage(e.data.value)
                  }
                }
                const subscription = observable.subscribe((value) => {
                  messageChannel.postMessage({ key, value })
                })

                return {
                  [Symbol.dispose]: () => {
                    window.removeEventListener('storage', updateFromStorageEvent)
                    subscription[Symbol.dispose]()
                    messageChannel.close()
                  },
                }
              })

              observable.subscribe(setToStorage)

              return this.resourceManager.useObservable(`useStoredState-${key}`, observable, () =>
                this.updateComponent(),
              )
            },
            useDisposable: this.resourceManager.useDisposable.bind(this.resourceManager),
          }

          return renderOptions
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
            cleanupResult
              .then((cleanup) => (this.cleanup = cleanup))
              .catch(() => {
                /** */
              })
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

          const fromProps = hasInjectorReference(this.props) && this.props.injector
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
      o.elementBaseName ? { extends: o.elementBaseName } : undefined,
    )
  } else {
    throw Error(`A custom shade with shadow DOM name '${o.shadowDomName}' has already been registered!`)
  }

  return (props: TProps & PartialElement<TElementBase>, children?: ChildrenList) => {
    const ElementType = customElements.get(customElementName)
    const el = new (ElementType as CustomElementConstructor)({
      ...(props as TProps & ElementCreationOptions & PartialElement<TElementBase>),
    }) as JSX.Element<TProps>

    el.props = props || ({} as TProps & PartialElement<TElementBase>)
    el.shadeChildren = children

    attachStyles(el, { style: o.style })
    attachProps(el, props)

    return el as JSX.Element
  }
}

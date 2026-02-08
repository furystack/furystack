import type { Constructable } from '@furystack/inject'
import { hasInjectorReference, Injector } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { ChildrenList, CSSObject, PartialElement, RenderOptions } from './models/index.js'
import { LocationService } from './services/location-service.js'
import { ResourceManager } from './services/resource-manager.js'
import { attachProps, attachStyles, setRenderMode } from './shade-component.js'
import { StyleManager } from './style-manager.js'
import type { VChild } from './vnode.js'
import { patchChildren, toVChildArray } from './vnode.js'

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
   * A default style that will be applied to the element as inline styles.
   * Can be overridden by external styles on instances.
   */
  style?: Partial<CSSStyleDeclaration>

  /**
   * CSS styles injected as a stylesheet during component registration.
   * Supports pseudo-selectors (&:hover, &:active) and nested selectors (& .class).
   * Use this for component-level styling that doesn't need per-instance overrides.
   *
   * @example
   * ```typescript
   * css: {
   *   padding: '16px',
   *   '&:hover': { backgroundColor: '#f0f0f0' },
   *   '& .title': { fontWeight: 'bold' }
   * }
   * ```
   */
  css?: CSSObject
}

/**
 * Factory method for creating Shade components
 * @param o The options object for component creation
 * @returns the JSX element
 */
export const Shade = <TProps, TElementBase extends HTMLElement = HTMLElement>(
  o: ShadeOptions<TProps, TElementBase>,
) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName

  const existing = customElements.get(customElementName)
  if (!existing) {
    // Register CSS styles if provided
    if (o.css) {
      StyleManager.registerComponentStyles(customElementName, o.css, o.elementBaseName)
    }

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
          this.updateComponent()
        }

        public async disconnectedCallback() {
          o.onDetach?.(this.getRenderOptions())
          await this.resourceManager[Symbol.asyncDispose]()
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

        private _updateScheduled = false

        /**
         * The VChild array from the previous render, with `_el` references
         * pointing to the real DOM nodes. Used to diff against the next render.
         */
        private _prevVTree: VChild[] | null = null

        /**
         * Schedules a component update via microtask. Multiple calls before the microtask
         * runs are coalesced into a single render pass.
         */
        public updateComponent() {
          if (!this._updateScheduled) {
            this._updateScheduled = true
            queueMicrotask(() => {
              this._updateScheduled = false
              this._performUpdate()
            })
          }
        }

        private _performUpdate() {
          setRenderMode(true)
          const renderResult = this.render(this.getRenderOptions())
          setRenderMode(false)

          const newVTree = toVChildArray(renderResult)
          patchChildren(this, this._prevVTree || [], newVTree)
          this._prevVTree = newVTree
        }

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

    if (o.elementBaseName) {
      el.setAttribute('is', customElementName)
    }

    attachStyles(el, { style: o.style })
    attachProps(el, props)

    return el as JSX.Element
  }
}

/**
 * Flushes any pending microtask-based component updates.
 * Useful in tests to wait for batched renders to complete before asserting DOM state.
 *
 * Note: this flushes one level of pending updates. If a render itself triggers new
 * `updateComponent()` calls, an additional `await flushUpdates()` may be needed.
 * @returns a promise that resolves after the current microtask queue has been processed
 */
export const flushUpdates = (): Promise<void> => new Promise<void>((resolve) => queueMicrotask(resolve))

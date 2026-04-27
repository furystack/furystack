import type { Constructable } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { ChildrenList, CSSObject, PartialElement, RenderOptions } from './models/index.js'
import type { RefObject } from './models/render-options.js'
import { LocationService } from './services/location-service.js'
import { ResourceManager } from './services/resource-manager.js'
import { attachProps, attachStyles, setRenderMode } from './shade-component.js'
import { StyleManager } from './style-manager.js'
import type { VChild } from './vnode.js'
import { patchChildren, toVChildArray } from './vnode.js'

export type ShadeOptions<TProps, TElementBase extends HTMLElement> = {
  /**
   * The custom element tag name used to register the component.
   * Must follow the Custom Elements naming convention (lowercase, must contain a hyphen).
   *
   * @example 'my-button', 'shade-dialog', 'app-header'
   */
  customElementName: string

  render: (options: RenderOptions<TProps, TElementBase>) => JSX.Element | string | null

  /**
   * Tag name of the base built-in element when extending one (e.g. `'a'`,
   * `'button'`, `'input'`). Required when {@link ShadeOptions.elementBase}
   * is set; passed to `customElements.define` as `{ extends }`.
   */
  elementBaseName?: string

  /**
   * Constructor of the built-in element to extend (e.g. `HTMLButtonElement`).
   * Defaults to `HTMLElement`. Pair with {@link ShadeOptions.elementBaseName}.
   */
  elementBase?: Constructable<TElementBase>

  /**
   * Inline styles applied to each component instance.
   * Use for per-instance dynamic overrides. Prefer `css` for component-level defaults.
   */
  style?: Partial<CSSStyleDeclaration>

  /**
   * CSS styles injected as a stylesheet during component registration.
   * Supports pseudo-selectors (`&:hover`, `&:active`) and nested selectors (`& .class`).
   *
   * **Best practice:** Prefer `css` over `style` for component defaults -- styles are injected
   * once per component type (better performance), and support pseudo-selectors and nesting.
   *
   * @example
   * ```typescript
   * css: {
   *   display: 'flex',
   *   padding: '16px',
   *   '&:hover': { backgroundColor: '#f0f0f0' },
   *   '& .title': { fontWeight: 'bold' }
   * }
   * ```
   */
  css?: CSSObject
}

/**
 * Defines and registers a Shade component as a custom element. Returns a
 * JSX-callable factory `(props, children?) => JSX.Element`. Throws when a
 * component with the same {@link ShadeOptions.customElementName} has
 * already been registered — registration is global and process-wide.
 *
 * The returned factory is the entry point for downstream code. The custom
 * element class itself is installed via `customElements.define` and never
 * directly exposed.
 */
export const Shade = <TProps, TElementBase extends HTMLElement = HTMLElement>(
  o: ShadeOptions<TProps, TElementBase>,
) => {
  const { customElementName } = o

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

        public getRenderCount() {
          return this._renderCount
        }

        public resourceManager = new ResourceManager()

        /**
         * Host props collected during the current render pass via `useHostProps`.
         * Applied to the host element after each render.
         */
        private _pendingHostProps: Array<Record<string, unknown> & { style?: Record<string, string> }> = []

        /**
         * The host props that were applied in the previous render, used for diffing.
         */
        private _prevHostProps: Record<string, unknown> | null = null

        /**
         * Cached ref objects keyed by the user-provided key string.
         */
        private _refs = new Map<string, RefObject<Element>>()

        /**
         * Set to true once disconnectedCallback fires. Prevents ghost re-renders
         * triggered by observable changes during async disposal.
         */
        private _disconnected = false

        public connectedCallback() {
          this._disconnected = false
          this._performUpdate()
        }

        public async disconnectedCallback() {
          this._disconnected = true
          this._refs.clear()
          this._prevVTree = null
          this._prevHostProps = null
          await this.resourceManager[Symbol.asyncDispose]()
        }

        public props!: TProps & { children?: JSX.Element[] } & PartialElement<TElementBase>

        public shadeChildren?: ChildrenList

        public render = (options: RenderOptions<TProps, TElementBase>) => {
          this._renderCount++
          return o.render(options)
        }

        private getRenderOptions = (): RenderOptions<TProps, TElementBase> => {
          const renderOptions: RenderOptions<TProps, TElementBase> = {
            props: this.props,
            injector: this.injector,
            children: this.shadeChildren,
            renderCount: this._renderCount,
            useHostProps: (hostProps) => {
              this._pendingHostProps.push(hostProps)
            },
            useRef: <T extends Element = HTMLElement>(key: string): RefObject<T> => {
              const existingRef = this._refs.get(key) as RefObject<T> | undefined
              if (existingRef) return existingRef
              const refObject = { current: null } as { current: T | null }
              this._refs.set(key, refObject as unknown as RefObject<Element>)
              return refObject as RefObject<T>
            },
            useObservable: (key, observable, options) => {
              const onChange = options?.onChange || (() => this.updateComponent())
              return this.resourceManager.useObservable(key, observable, onChange, options)
            },
            useState: (key, initialValue) =>
              this.resourceManager.useState(key, initialValue, this.updateComponent.bind(this)),
            useSearchState: (key, initialValue) =>
              this.resourceManager.useObservable(
                `useSearchState-${key}`,
                this.injector.get(LocationService).useSearchParam(key, initialValue),
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
          if (this._disconnected) return
          if (!this._updateScheduled) {
            this._updateScheduled = true
            queueMicrotask(() => {
              if (!this._updateScheduled || this._disconnected) return
              this._updateScheduled = false
              this._performUpdate()
            })
          }
        }

        /**
         * Performs a synchronous component update, canceling any pending async update.
         * Used during parent-to-child reconciliation so the entire subtree settles
         * in a single call frame rather than cascading across microtask ticks.
         */
        public updateComponentSync() {
          if (this._disconnected) return
          this._updateScheduled = false
          this._performUpdate()
        }

        private _performUpdate() {
          this._pendingHostProps = []
          let renderResult: unknown
          setRenderMode(true)
          try {
            renderResult = this.render(this.getRenderOptions())
          } finally {
            setRenderMode(false)
          }

          // Apply host props before patching children so that child components
          // rendered synchronously can discover parent state (e.g. injector)
          // via getInjectorFromParent().
          this._applyHostProps()

          const newVTree = toVChildArray(renderResult)
          patchChildren(this, this._prevVTree || [], newVTree)
          this._prevVTree = newVTree
        }

        /**
         * Merges all pending host props from the render pass and applies them
         * to the host element, diffing against the previously applied host props.
         */
        private _applyHostProps() {
          if (this._pendingHostProps.length === 0) {
            if (this._prevHostProps) {
              // All host props were removed — clean up
              for (const key of Object.keys(this._prevHostProps)) {
                if (key === 'style') continue
                this.removeAttribute(key)
              }
              if (this._prevHostProps.style) {
                for (const sk of Object.keys(this._prevHostProps.style as Record<string, string>)) {
                  if (sk.startsWith('--')) {
                    this.style.removeProperty(sk)
                  } else {
                    ;(this.style as unknown as Record<string, string>)[sk] = ''
                  }
                }
              }
              this._prevHostProps = null
            }
            return
          }

          // Merge all pending host prop calls into a single object
          const merged: Record<string, unknown> = {}
          let mergedStyle: Record<string, string> | undefined

          for (const hp of this._pendingHostProps) {
            for (const [key, value] of Object.entries(hp)) {
              if (key === 'style' && typeof value === 'object' && value !== null) {
                mergedStyle = { ...mergedStyle, ...(value as Record<string, string>) }
              } else {
                merged[key] = value
              }
            }
          }

          if (mergedStyle) {
            merged.style = mergedStyle
          }

          const oldHP = this._prevHostProps || {}
          const newHP = merged

          // Remove attributes no longer present
          for (const key of Object.keys(oldHP)) {
            if (key === 'style') continue
            if (!(key in newHP)) {
              if (key.startsWith('on') && typeof oldHP[key] === 'function') {
                ;(this as unknown as Record<string, unknown>)[key] = null
              } else {
                this.removeAttribute(key)
              }
            }
          }

          // Apply new/changed attributes
          for (const [key, value] of Object.entries(newHP)) {
            if (key === 'style') continue
            if (oldHP[key] !== value) {
              if (typeof value === 'function' || (typeof value === 'object' && value !== null)) {
                ;(this as unknown as Record<string, unknown>)[key] = value
              } else if (value === null || value === undefined || value === false) {
                if (key in this) {
                  ;(this as unknown as Record<string, unknown>)[key] = undefined
                }
                this.removeAttribute(key)
              } else {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                this.setAttribute(key, String(value))
              }
            }
          }

          // Diff styles
          const oldStyle = (oldHP.style as Record<string, string>) || {}
          const newStyle = (mergedStyle as Record<string, string>) || {}

          for (const sk of Object.keys(oldStyle)) {
            if (!(sk in newStyle)) {
              if (sk.startsWith('--')) {
                this.style.removeProperty(sk)
              } else {
                ;(this.style as unknown as Record<string, string>)[sk] = ''
              }
            }
          }

          for (const [sk, sv] of Object.entries(newStyle)) {
            if (oldStyle[sk] !== sv) {
              if (sk.startsWith('--')) {
                this.style.setProperty(sk, sv)
              } else {
                ;(this.style as unknown as Record<string, string>)[sk] = sv
              }
            }
          }

          this._prevHostProps = merged
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

          const fromProps = (this.props as { injector?: unknown } | undefined)?.injector
          if (fromProps instanceof Injector) {
            return fromProps
          }

          const fromParent = this.getInjectorFromParent()
          if (fromParent) {
            this._injector = fromParent
            return fromParent
          }
          // Fallback for isolated components (tests and non-DI use cases) that
          // never reach for any services. Components that do resolve tokens
          // will fail loudly at resolution time, since this throwaway injector
          // has no bindings.
          return new Injector()
        }

        public set injector(i: Injector) {
          this._injector = i
        }
      },
      o.elementBaseName ? { extends: o.elementBaseName } : undefined,
    )
  } else {
    throw Error(`A custom shade with name '${o.customElementName}' has already been registered!`)
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
 * Awaits the next microtask tick — long enough for `updateComponent`'s
 * batching microtask to drain. A single `await flushUpdates()` settles the
 * entire component tree because child reconciliation is synchronous within
 * the parent's render. Use in tests before asserting on DOM state.
 */
export const flushUpdates = (): Promise<void> => new Promise<void>((resolve) => queueMicrotask(resolve))

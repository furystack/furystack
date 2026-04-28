import type { Injector } from '@furystack/inject'
import type { ObservableValue, ValueObserverOptions } from '@furystack/utils'
import type { LocationService } from '../services/location-service.js'
import type { ChildrenList } from './children-list.js'
import type { PartialElement } from './partial-element.js'

/**
 * A reference object returned by `useRef`.
 * `current` is set to the DOM element when it is mounted, and `null` when unmounted.
 * The `readonly` modifier ensures covariance so that `RefObject<HTMLInputElement>`
 * is assignable to `RefObject<Element>`.
 */
export type RefObject<T extends Element = HTMLElement> = {
  readonly current: T | null
}

/**
 * Options provided to a Shade component's `render` function.
 * Contains the current props, injector, children, and hooks for managing state, side effects, and host element attributes.
 * @typeParam TProps - The component's props type
 * @typeParam TElementBase - The base HTML element type (defaults to HTMLElement)
 */
export type RenderOptions<TProps, TElementBase extends HTMLElement = HTMLElement> = {
  readonly props: TProps & PartialElement<TElementBase>
  renderCount: number
  injector: Injector
  children?: ChildrenList
  /**
   * Declaratively sets attributes and styles on the host custom element.
   * Can be called multiple times per render; each call merges into the previous values.
   *
   * CSS custom properties (e.g. `--my-color`) are applied via `setProperty`.
   * The `style` property accepts both standard camelCase properties and CSS custom properties.
   *
   * **Best practice:** Use `useHostProps` for data attributes, ARIA attributes, CSS variables,
   * and event handlers on the host element instead of imperative DOM manipulation.
   *
   * @param hostProps An object of attribute key-value pairs, optionally including a `style` record
   *
   * **Note:** Object and function values are assigned as properties on the host element
   * (not as attributes). This means you can set event handlers (e.g. `onclick`) and
   * even class properties like `injector` via `useHostProps`.
   *
   * @example
   * ```typescript
   * useHostProps({
   *   'data-variant': props.variant,
   *   role: 'progressbar',
   *   'aria-valuenow': String(value),
   *   style: {
   *     '--btn-color-main': colors.main,
   *     display: 'flex',
   *   },
   * })
   * ```
   */
  useHostProps: (hostProps: Record<string, unknown> & { style?: Record<string, string> }) => void

  /**
   * Creates a mutable ref object that can be attached to intrinsic JSX elements via the `ref` prop.
   * The ref's `current` property will be set to the DOM element after mount and `null` on unmount.
   *
   * Refs are cached by key, so calling `useRef` with the same key returns the same object across renders.
   *
   * **Best practice:** Prefer declarative JSX and `useHostProps` when possible.
   * Use refs sparingly for imperative needs like focus management or measuring elements.
   *
   * @param key A unique key for caching the ref object
   * @returns A ref object with a `current` property
   *
   * @example
   * ```typescript
   * const inputRef = useRef<HTMLInputElement>('input')
   * // In JSX:
   * <input ref={inputRef} />
   * // Later:
   * inputRef.current?.focus()
   * ```
   */
  useRef: <T extends Element = HTMLElement>(key: string) => RefObject<T>

  /**
   * Creates a disposable resource the first time it is requested per `key`,
   * caches it across renders, and disposes it on `disconnectedCallback`.
   * When `deps` is provided, the cached resource is disposed + re-created
   * whenever the serialized deps change (use for `key`-stable resources
   * that depend on dynamic inputs).
   */
  useDisposable: <T extends Disposable | AsyncDisposable>(key: string, factory: () => T, deps?: readonly unknown[]) => T

  /**
   * Creates a state object from an existing observable value.
   *
   * **Important:** By default, this will trigger a full component re-render when the observable value changes.
   * To prevent re-renders (e.g., for manual DOM updates or animations), provide a custom `onChange` callback.
   *
   * @param key The key for caching the observable value
   * @param observable The observable value to observe
   * @param options Optional options for the observer
   * @param options.onChange Custom callback when value changes. If not provided, the component will re-render on each change.
   * @returns tuple with the current value and a setter function
   *
   * @example
   * // Default behavior: re-renders component on change
   * const [count] = useObservable('count', countObservable)
   *
   * @example
   * // Custom onChange: no re-render, update host element via useHostProps
   * useHostProps({ 'data-active': count > 0 ? '' : undefined })
   * const [count] = useObservable('count', countObservable, {
   *   onChange: () => {
   *     // Triggers a re-render so useHostProps above picks up the new value
   *   }
   * })
   */
  useObservable: <T>(
    key: string,
    observable: ObservableValue<T>,
    options?: ValueObserverOptions<T> & { onChange?: (newValue: T) => void },
  ) => [value: T, setValue: (newValue: T) => void]

  /**
   * Local component state. Returns `[value, setValue]`; calling the setter
   * with a new value triggers a re-render. Preferred over manually wiring
   * an `ObservableValue` + `useObservable` (`furystack/prefer-use-state`
   * enforces this).
   */
  useState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]

  /**
   * State backed by a URL search-string parameter via {@link LocationService}.
   * Bidirectional: setting the value pushes a history entry; navigating
   * (back/forward, manual edit) updates the value. `initialValue` applies
   * when the key is absent from the current URL.
   */
  useSearchState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]

  /**
   * State backed by `localStorage` (or a custom `Storage`). Synchronizes
   * across tabs via the `storage` event and a `BroadcastChannel`.
   * `initialValue` applies when the key is absent from `storageArea`.
   */
  useStoredState: <T>(
    key: string,
    initialValue: T,
    storageArea?: Storage,
  ) => [value: T, setValue: (newValue: T) => void]
}

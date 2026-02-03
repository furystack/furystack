import type { Injector } from '@furystack/inject'
import type { ObservableValue, ValueObserverOptions } from '@furystack/utils'
import type { ChildrenList } from './children-list.js'
import type { PartialElement } from './partial-element.js'

export type RenderOptions<TProps, TElementBase extends HTMLElement = HTMLElement> = {
  readonly props: TProps & PartialElement<TElementBase>
  renderCount: number
  injector: Injector
  children?: ChildrenList
  element: JSX.Element<TProps>
  /**
   * Creates and disposes a resource after the component has been detached from the DOM
   * @param key The key for caching the disposable resource
   * @param factory A factory method for creating the disposable resource
   * @returns The Disposable instance
   */
  useDisposable: <T extends Disposable | AsyncDisposable>(key: string, factory: () => T) => T

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
   * // Custom onChange: no re-render, manual DOM update
   * const [count] = useObservable('count', countObservable, {
   *   onChange: (newValue) => {
   *     element.classList.toggle('active', newValue > 0)
   *   }
   * })
   */
  useObservable: <T>(
    key: string,
    observable: ObservableValue<T>,
    options?: ValueObserverOptions<T> & { onChange?: (newValue: T) => void },
  ) => [value: T, setValue: (newValue: T) => void]

  /**
   * Creates a state object that will trigger a component re-render on change
   * @param key The Key for caching the observable value
   * @param initialValue The initial value for the observable
   * @returns tuple with the current value and a setter function
   */
  useState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]

  /**
   * Creates a state object that will use a value from the search string of the current location. Triggers a component re-render on change
   * @param key The Key for caching the observable value
   * @param initialValue The initial value - if the value is not found in the search string
   * @returns a tuple with the current value and a setter function
   */
  useSearchState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]

  /**
   * Creates a state object that will use a value from the storage area. Triggers a component re-render on change
   * @param key The key in the storage area
   * @param initialValue The initial value that will be used if the key is not found in the storage area
   * @param storageArea The storage area to use
   * @returns a tuple with the current value and a setter function
   */
  useStoredState: <T>(
    key: string,
    initialValue: T,
    storageArea?: Storage,
  ) => [value: T, setValue: (newValue: T) => void]
}

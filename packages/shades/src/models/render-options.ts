import type { Injector } from '@furystack/inject'
import type { ChildrenList } from './children-list'
import type { Disposable, ObservableValue } from '@furystack/utils'

export type RenderOptions<TProps> = {
  readonly props: TProps

  injector: Injector
  children?: ChildrenList
  element: JSX.Element<TProps>
  /**
   * Creates and disposes a resource after the component has been detached from the DOM
   *
   * @param key The key for caching the disposable resource
   * @param factory A factory method for creating the disposable resource
   * @returns The Disposable instance
   */
  useDisposable: <T extends Disposable>(key: string, factory: () => T) => T

  /**
   *
   * @param key The key for caching the observable value
   * @param observable The observable value to observe
   * @param callback Optional callback for reacting to changes
   * @param getLast An option to trigger the callback with the initial value
   * @returns tuple with the current value and a setter function
   */
  useObservable: <T>(
    key: string,
    observable: ObservableValue<T>,
    callback?: (newValue: T) => void,
    getLast?: boolean,
  ) => [value: T, setValue: (newValue: T) => void]

  /**
   * Creates a state object that will trigger a component re-render on change
   *
   * @param key The Key for caching the observable value
   * @param initialValue The initial value for the observable
   * @returns tuple with the current value and a setter function
   */
  useState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]

  /**
   * Creates a state object that will use a value from the search string of the current location. Triggers a component re-render on change
   *
   * @param key The Key for caching the observable value
   * @param initialValue The initial value - if the value is not found in the search string
   * @returns a tuple with the current value and a setter function
   */
  useSearchState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]
}

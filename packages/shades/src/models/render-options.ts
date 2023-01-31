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
   *
   * @param key
   * @param initialValue
   * @returns
   */
  useState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]
  useSearchState: <T>(key: string, initialValue: T) => [value: T, setValue: (newValue: T) => void]
}

// export type RenderOptionsState<TState> = unknown extends TState
//   ? {}
//   : {
//       /**
//        * @returns the current state object
//        */
//       getState: () => TState
//       /**
//        * Update the current component state's multiple properties in one-shot
//        *
//        * @param newState The partial new state object
//        * @param skipRender Option to skip the render process
//        */
//       updateState: (newState: PartialElement<TState>, skipRender?: boolean) => void
//       /**
//        * @param key The key on the state object
//        * @returns A tuple with the value and the setter function
//        */
//       useState: <T extends keyof TState>(
//         key: T,
//       ) => [value: TState[T], setValue: (newValue: TState[T], skipRender?: boolean) => void]
//     }

// export type RenderOptions<TProps, TState> = RenderOptionsBase<TProps, TState> & RenderOptionsState<TState>

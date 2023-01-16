import type { Injector } from '@furystack/inject'
import type { PartialElement } from './partial-element'
import type { ChildrenList } from './children-list'
import type { ObservableValue } from '@furystack/utils'

export type RenderOptions<TProps, TState> = {
  readonly props: TProps

  injector: Injector
  children?: ChildrenList
  element: JSX.Element<TProps, TState>
  useObservable: <T>(
    key: string,
    observable: ObservableValue<T>,
    callback?: (newValue: T) => void,
  ) => [value: T, setValue: (newValue: T) => void]
  cleanupUsedObservables: () => void
} & (unknown extends TState
  ? {}
  : {
      /**
       * @deprecated use useState() instead
       * @returns the current state object
       */
      getState: () => TState
      /**
       * @deprecated use useState() instead
       * @param newState The partial new state object
       * @param skipRender Option to skip the render process
       */
      updateState: (newState: PartialElement<TState>, skipRender?: boolean) => void
      /**
       * @param key The key on the state object
       * @returns A tuple with the value and the setter function
       */
      useState: <T extends keyof TState>(
        key: T,
      ) => [value: TState[T], setValue: (newValue: TState[T], skipRender?: boolean) => void]
    })

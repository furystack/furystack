import type { Injector } from '@furystack/inject'
import type { PartialElement } from './partial-element'
import type { ChildrenList } from './children-list'
import type { Disposable, ObservableValue } from '@furystack/utils'

export type RenderOptionsBase<TProps, TState> = {
  readonly props: TProps

  injector: Injector
  children?: ChildrenList
  element: JSX.Element<TProps, TState>
  useDisposable: <T extends Disposable>(key: string, factory: () => T) => T
  useObservable: <T>(
    key: string,
    observable: ObservableValue<T>,
    callback?: (newValue: T) => void,
    getLast?: boolean,
  ) => [value: T, setValue: (newValue: T) => void]
}

export type RenderOptionsState<TState> = unknown extends TState
  ? {}
  : {
      /**
       * @returns the current state object
       */
      getState: () => TState
      /**
       * Update the current component state's multiple properties in one-shot
       *
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
    }

export type RenderOptions<TProps, TState> = RenderOptionsBase<TProps, TState> & RenderOptionsState<TState>

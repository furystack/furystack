import type { Injector } from '@furystack/inject'
import type { PartialElement } from './partial-element'
import type { ChildrenList } from './children-list'

export type RenderOptions<TProps, TState> = {
  readonly props: TProps

  injector: Injector
  children?: ChildrenList
  element: JSX.Element<TProps, TState>
} & (unknown extends TState
  ? {}
  : {
      getState: () => TState
      updateState: (newState: PartialElement<TState>, skipRender?: boolean) => void
    })

import { PartialElement } from './partial-element'
import { ChildrenList } from './children-list'
import { Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'

export interface RenderOptions<TProps, TState> {
  readonly props: TProps
  getState: () => TState
  updateState: (newState: PartialElement<TState>, skipRender?: boolean) => void
  injector: Injector
  children: ChildrenList
  element: JSX.Element<TProps, TState>
  logger: ScopedLogger
}

import { Injector } from '@furystack/inject'
import { PartialElement } from '../jsx'
import { ChildrenList } from './children-list'

export interface RenderOptions<TProps, TState> {
  props: TProps
  getState: () => TState
  updateState: (newState: PartialElement<TState>) => void
  injector: Injector
  children: ChildrenList
  element: JSX.Element<TProps, TState>
}

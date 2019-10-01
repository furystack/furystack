import { DeepPartial } from '@sensenet/client-utils'
import { Injector } from '@furystack/inject'
import { ChildrenList } from './children-list'

export interface RenderOptions<TProps, TState> {
  props: TProps
  getState: () => TState
  updateState: (newState: DeepPartial<TState>) => void
  injector: Injector
  children: ChildrenList
}

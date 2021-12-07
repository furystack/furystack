import { Injector } from '@furystack/inject'
import { PartialElement } from './partial-element'
import { ChildrenList } from './children-list'
import { CurrentValuesFromObservables, Observables } from './observables'

export type RenderOptions<TProps, TState, TObservables extends Observables> = {
  readonly props: TProps

  injector: Injector
  children: ChildrenList
  element: JSX.Element<TProps, TState>
} & (unknown extends TState
  ? {}
  : {
      getState: () => TState
      updateState: (newState: PartialElement<TState>, skipRender?: boolean) => void
    }) &
  (unknown extends TObservables
    ? {}
    : {
        getObservableValues: () => CurrentValuesFromObservables<TObservables>
      })

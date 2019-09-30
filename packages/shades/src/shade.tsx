import { Injector } from '@furystack/inject'
import { DeepPartial, ObservableValue } from '@sensenet/client-utils'
import { shadeInjector } from '.'

export interface ShadeOptions<TProps, TState = undefined> {
  initialState: TState
  defaultProps: TProps
  render: (options: {
    props: TProps
    state: TState
    updateState: (newState: DeepPartial<TState>) => void
    injector: Injector
  }) => JSX.Element
}

export const Shade = <TProps, TState>(o: ShadeOptions<TProps, TState>) => {
  return function ShadeCreator(props: TProps) {
    const state = new ObservableValue({ ...o.initialState })
    const createJsx = () => {
      const newJsx = o.render({
        injector: shadeInjector,
        props,
        state: state.getValue(),
        updateState: (newState: DeepPartial<TState>) => {
          state.setValue({ ...state.getValue(), ...newState })
        },
      })
      const observer = state.subscribe(() => {
        newJsx.onStateChanged && newJsx.onStateChanged()
      })
      newJsx.onDetached = () => observer.dispose()
      return newJsx
    }
    const jsx = createJsx()
    return jsx
  }
}

export type ShadeReturnValue<TProps, TState> = ReturnType<typeof Shade>

export const isAdvancedShadeComponent = <TProps, TState>(obj: any): obj is ShadeReturnValue<TProps, TState> => {
  return typeof obj === 'function' && obj.name === 'ShadeCreator'
}

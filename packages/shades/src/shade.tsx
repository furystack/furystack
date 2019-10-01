import { Injector } from '@furystack/inject'
import { DeepPartial, ObservableValue } from '@sensenet/client-utils'
import { v4 } from 'uuid'
import { shadeInjector, ChildrenList } from '.'

export interface RenderOptions<TProps, TState> {
  props: TProps
  getState: () => TState
  updateState: (newState: DeepPartial<TState>) => void
  injector: Injector
  children: ChildrenList
}

export interface ShadeOptions<TProps, TState> {
  initialState: TState
  shadowDomName?: string
  render: (options: RenderOptions<TProps, TState>) => JSX.Element
  construct?: (options: RenderOptions<TProps, TState>) => void
}

export const Shade = <TProps, TState>(o: ShadeOptions<TProps, TState>) => {
  // register shadow-dom element
  const customElementName = o.shadowDomName || `shade-${v4()}`

  const existing = customElements.get(customElementName)
  if (!existing) {
    customElements.define(
      customElementName,
      class extends HTMLElement {
        public onAttached = new ObservableValue<void>()

        public onDetached = new ObservableValue<void>()

        public props: ObservableValue<TProps & { children?: JSX.Element[] }>

        public onUpdated = new ObservableValue<JSX.Element>()

        public state = new ObservableValue(o.initialState)

        public shadeChildren = new ObservableValue<ChildrenList>([])

        public render = (options: RenderOptions<TProps, TState>) => o.render(options)

        private getRenderOptions(): RenderOptions<TProps, TState> {
          const props = this.props.getValue()
          const getState = () => this.state.getValue()
          return {
            props,
            getState,
            injector: shadeInjector,
            updateState: newState => this.state.setValue({ ...this.state.getValue(), ...newState }),
            children: this.shadeChildren.getValue(),
          }
        }

        public updateComponent() {
          const newJsx = this.render(this.getRenderOptions())
          this.innerHTML = ''
          this.append(newJsx)
          this.onUpdated.setValue(newJsx)
          return newJsx
        }

        public callConstruct() {
          o.construct && o.construct(this.getRenderOptions())
          this.props.subscribe(props => this.updateComponent())
        }

        constructor(_props: TProps) {
          super()
          this.props = new ObservableValue()
          this.state.subscribe(() => this.updateComponent())
          this.shadeChildren.subscribe(() => this.updateComponent())
        }
      },
    )
  }

  return (props: TProps, children: ChildrenList) => {
    const el = document.createElement(customElementName, {
      ...props,
    }) as JSX.Element<TProps, TState>
    el.props.setValue(props)
    el.shadeChildren.setValue(children)
    el.callConstruct()
    return el as JSX.Element
  }
}

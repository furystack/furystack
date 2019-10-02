import { Shade, createComponent } from '@furystack/shades'
import { CounterContainer } from '../components/counter-container'

export const CounterDemo = Shade({
  shadowDomName: 'shade-app-counter-demo',
  initialState: undefined,
  render: () => <CounterContainer />,
})

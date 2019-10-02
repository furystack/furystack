import { Shade, createComponent } from '@furystack/shades'
import { CounterContainer } from '../components/counter-container'

export const CounterDemo = Shade({
  initialState: undefined,
  render: () => <CounterContainer />,
})

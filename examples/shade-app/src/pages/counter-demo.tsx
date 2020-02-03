import { CounterContainer } from '../components/counter-container'
import { Shade, createComponent } from '@furystack/shades'

export const CounterDemo = Shade({
  shadowDomName: 'shade-app-counter-demo',
  render: () => <CounterContainer />,
})

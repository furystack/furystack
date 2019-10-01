import { createComponent, ShadeComponent, Shade } from '@furystack/shades'

export interface CounterProps {
  defaultValue: number
}

export interface CounterState {
  value: number
}

export const Counter = Shade<CounterProps, CounterState>({
  shadowDomName: 'custom-alma',
  initialState: { value: 0 },
  construct: ({ props, updateState }) => {
    updateState({ value: props.defaultValue })
  },
  render: ({ props, getState, updateState }) => {
    return (
      <div
        style={{
          border: '1px solid black',
          display: 'inline-flex',
          margin: '1em',
          width: '75px',
          justifyContent: 'space-between',
        }}>
        <button
          onclick={(ev: MouseEvent) => {
            ev.stopPropagation()
            updateState({ value: getState().value + 1 })
          }}>
          +
        </button>
        <span
          style={{
            color: getState().value === props.defaultValue ? 'darkgreen' : 'red',
          }}>
          {getState().value.toString()}{' '}
        </span>
        <button
          onclick={(ev: MouseEvent) => {
            ev.stopPropagation()
            updateState({ value: getState().value - 1 })
          }}>
          -
        </button>
      </div>
    )
  },
})

const CounterContainer = Shade({
  shadowDomName: 'counter-container',
  initialState: { arr: [] as number[] },
  construct: ({ updateState }) => {
    const arr = []
    for (let i = 0; i < 10000; i++) {
      arr[i] = Math.round(Math.random() * 100)
    }
    updateState({ arr })
  },
  render: ({ getState }) => {
    return (
      <div style={{ overflow: 'auto', width: '100%', height: '100%' }}>
        {getState().arr.map(v => (
          <Counter defaultValue={v} />
        ))}
      </div>
    )
  },
})

export const Body: ShadeComponent = () => {
  return (
    <div
      id="Body"
      style={{
        margin: '10px',
        padding: '10px',
        background: 'white',
        boxShadow: '1px 1px 3px rgba(0,0,0,.2)',
        width: 'calc(100% - 40px)',
        height: '100%',
        overflow: 'hidden',
      }}>
      <CounterContainer />
    </div>
  )
}

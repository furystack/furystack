import { Shade, createComponent } from '@furystack/shades'

export interface CounterProps {
  defaultValue: number
}

export interface CounterState {
  value: number
}

export const Counter = Shade<CounterProps, CounterState>({
  shadowDomName: 'shade-app-counter',
  initialState: { value: 0 },
  onAttach: () => {
    console.log('Counter Attached')
  },
  onDetach: () => {
    console.log('Counter Detached')
  },
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
          onclick={ev => {
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
          onclick={ev => {
            ev.stopPropagation()
            updateState({ value: getState().value - 1 })
          }}>
          -
        </button>
      </div>
    )
  },
})

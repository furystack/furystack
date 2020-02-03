import { Counter } from './counter'
import { Shade, createComponent } from '@furystack/shades'

export const CounterContainer = Shade({
  shadowDomName: 'shade-app-counter-container',
  initialState: { arr: [] as number[] },
  constructed: ({ updateState }) => {
    const arr = []
    for (let i = 0; i < 1000; i++) {
      arr[i] = Math.round(Math.random() * 100)
    }
    updateState({ arr })
  },
  render: ({ getState, updateState }) => {
    return (
      <div style={{ overflow: 'auto', width: '100%', height: '100%' }}>
        <button
          onclick={() => {
            const arr = []
            for (let i = 0; i < 1000; i++) {
              arr[i] = Math.round(Math.random() * 100)
            }
            updateState({ arr })
          }}>
          randomize
        </button>
        <hr />
        {getState().arr.map(v => (
          <Counter defaultValue={v} />
        ))}
      </div>
    )
  },
})

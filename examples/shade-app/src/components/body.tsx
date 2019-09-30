import { createComponent, ShadeComponentWithoutProps, Shade } from '@furystack/shades'

export const Alma = Shade({
  initialState: { no: 1 },
  defaultProps: { foo: 'Alma' },
  render: ({ props, state, updateState }) => (
    <div
      onclick={() => {
        updateState({ no: state.no + 1 })
      }}>
      Alma: {props.foo} - {state.no.toString()}
    </div>
  ),
})

export const Body: ShadeComponentWithoutProps = () => {
  return (
    <div
      id="Body"
      style={{
        margin: '10px',
        padding: '10px',
        background: 'white',
        boxShadow: '1px 1px 3px rgba(0,0,0,.2)',
      }}>
      {' '}
      eee
      <Alma foo="Körte" />
    </div>
  )
}

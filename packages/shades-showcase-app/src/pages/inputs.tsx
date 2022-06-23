import { createComponent, Shade } from '@furystack/shades'
import { Input } from '@furystack/shades-common-components'

export const InputsPage = Shade({
  shadowDomName: 'inputs-page',
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <h1>Inputs</h1>
        <Input labelTitle="Test Input Field" value={'Test value'} autofocus />
      </div>
    )
  },
})

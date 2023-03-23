import { Shade, createComponent } from '@furystack/shades'
import { Button, Input } from '@furystack/shades-common-components'

export const FormsPage = Shade({
  shadowDomName: 'forms-page',
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
        <h1>Form</h1>
        <div style={{ display: 'flex', gap: '32px' }}>
          <form
            onsubmit={(ev) => {
              const value = Object.fromEntries(new FormData(ev.target as HTMLFormElement).entries())
              console.log(value)
            }}
          >
            <Input labelTitle="Value 1" name="value-1" variant="outlined" />
            <Input labelTitle="Value 2" name="value-2" variant="outlined" required />
            <Input labelTitle="Value 3" name="value-3" variant="outlined" />
            <Button type="submit">Submit</Button>
          </form>
        </div>
      </div>
    )
  },
})

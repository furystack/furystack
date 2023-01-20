import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'

export const ButtonsPage = Shade({
  shadowDomName: 'buttons-page',
  render: ({ useState }) => {
    const [disabled, setDisabled] = useState('disabled', false)
    const txt = 'Button Text'
    const onclick = () => {
      /** */
    }
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <h1>Buttons</h1>
        <div>
          <div>
            <Button onclick={onclick} disabled={disabled}>
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={disabled} variant="outlined">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} variant="outlined" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="outlined" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="outlined" color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={disabled} variant="contained">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={disabled} variant="contained" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="contained" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={disabled} variant="contained" color="error">
              {txt}
            </Button>
          </div>
        </div>
        <Button
          onclick={() => {
            setDisabled(!disabled)
          }}
        >
          Disable All
        </Button>

        <Button
          style={{
            display: 'inline',
            width: '150px',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '20px',
            border: '3px dashed red',
            padding: '1em',
          }}
          title="A button with attached custom CSS attributes"
        >
          Custom Style
        </Button>
      </div>
    )
  },
})

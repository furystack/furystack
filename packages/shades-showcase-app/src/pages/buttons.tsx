import { createComponent, LocationService, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'

export const ButtonsPage = Shade({
  shadowDomName: 'buttons-page',
  render: ({ useObservable, injector }) => {
    const [disabled, setDisabled] = useObservable(
      'disabled',
      injector.getInstance(LocationService).useSearchParam<'true' | 'false'>('disabled', 'false'),
    )

    const isDisabled = disabled === 'true'

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
            <Button onclick={onclick} disabled={isDisabled}>
              {txt}
            </Button>

            <Button onclick={onclick} disabled={isDisabled} color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={isDisabled} variant="outlined">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={isDisabled} variant="outlined" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} variant="outlined" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} variant="outlined" color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={isDisabled} variant="contained">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={isDisabled} variant="contained" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} variant="contained" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={isDisabled} variant="contained" color="error">
              {txt}
            </Button>
          </div>
        </div>
        <Button
          onclick={() => {
            setDisabled(disabled === 'true' ? 'false' : 'true')
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

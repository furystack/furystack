import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'

export const ButtonsPage = Shade({
  shadowDomName: 'buttons-page',
  style: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  render: ({ useSearchState }) => {
    const [isEnabledObject, setIsEnabledObject] = useSearchState('disabled', { isEnabled: false })

    const txt = 'Button Text'
    const onclick = () => {
      /** */
    }

    return (
      <>
        <h1>Buttons</h1>
        <div>
          <div>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled}>
              {txt}
            </Button>

            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="outlined" color="error">
              {txt}
            </Button>
          </div>
          <div>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained">
              {txt}
            </Button>

            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="primary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="secondary">
              {txt}
            </Button>
            <Button onclick={onclick} disabled={!isEnabledObject.isEnabled} variant="contained" color="error">
              {txt}
            </Button>
          </div>
        </div>
        <Button
          onclick={() => {
            setIsEnabledObject({
              isEnabled: !isEnabledObject.isEnabled,
            })
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
      </>
    )
  },
})

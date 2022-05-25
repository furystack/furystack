import { createComponent, Shade } from '@furystack/shades'
import { Button } from '@furystack/shades-common-components'

export const ButtonsPage = Shade<unknown, { disabled: boolean }>({
  getInitialState: () => ({ disabled: false }),
  shadowDomName: 'buttons-page',
  render: ({ getState, updateState }) => {
    const { disabled } = getState()
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
            updateState({ disabled: !getState().disabled })
          }}
        >
          Disable All
        </Button>
      </div>
    )
  },
})

import { createComponent, Shade } from '@furystack/shades'
import { Button, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const ButtonsPage = Shade({
  shadowDomName: 'buttons-page',
  render: ({ useSearchState }) => {
    const [isEnabledObject, setIsEnabledObject] = useSearchState('disabled', { isEnabled: false })

    const txt = 'Button Text'
    const onclick = () => {
      /** */
    }

    return (
      <PageContainer maxWidth="800px" centered>
        <PageHeader
          icon="🔘"
          title="Buttons"
          description="The Button component provides clickable elements with multiple visual variants and color schemes. Choose from default, outlined, or contained styles, each available in primary, secondary, error, and default colors. Buttons support disabled states and can be customized with inline styles for special use cases."
        />
        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              width: '150px',
              alignSelf: 'center',
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
        </Paper>
      </PageContainer>
    )
  },
})
